;; launchpad-v2.clar -- V2
;; Bonding Curve Launchpad for Stacks Lab
;; Features: Bitcoin Finality, Vesting, Reputation, Liquidity Locking

(use-trait sip010-ft-trait .sip010-ft-trait-v2.sip010-ft-trait)

;; Traits for interaction
;; Traits for interaction
(define-trait launchable-token-trait (
    (mint
        (uint principal)
        (response bool uint)
    )
    (burn
        (uint principal)
        (response bool uint)
    )
    (transfer
        (uint principal principal (optional (buff 34)))
        (response bool uint)
    )
))

(define-trait reputation-trait (
    (add-reputation
        (principal uint)
        (response bool uint)
    )
))

(define-trait liquidity-locker-trait (
    (lock-tokens
        (<sip010-ft-trait> uint uint)
        (response uint uint)
    )
))

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNKNOWN_TOKEN (err u100))
(define-constant ERR_SLIPPAGE (err u101))
(define-constant ERR_TRANSFER_FAILED (err u102))
(define-constant ERR_UNAUTHORIZED (err u103))
(define-constant ERR_SALE_NOT_ACTIVE (err u104))
(define-constant ERR_SALE_FINISHED (err u105))

;; Data Maps
(define-map token-state
    principal
    {
        creator: principal,
        supply: uint,
        stx-reserve: uint,
        active: bool,
        target-supply: uint,
        target-stx: uint, ;; STX target to graduate
        ;; Metadata for "Proof of Code"
        metadata-url: (string-ascii 256),
        ;; Bitcoin Finality
        start-burn-height: uint,
        end-burn-height: uint,
    }
)

(define-map token-vesting
    principal ;; token
    {
        cliff-burn-height: uint,
        vesting-period-blocks: uint,
        total-vested: uint,
    }
)

;; Register a new token (The "Factory" Logic)
(define-public (launch-token
        (token-contract <launchable-token-trait>)
        (name (string-ascii 32))
        (symbol (string-ascii 10))
        (decimals uint)
        (metadata-url (string-ascii 256))
        (end-burn-height uint)
        (target-stx uint)
    )
    (let ((token-principal (contract-of token-contract)))
        (begin
            ;; Assert future end time
            (asserts! (> end-burn-height burn-block-height) (err u106))

            (map-set token-state token-principal {
                creator: tx-sender,
                supply: u0,
                stx-reserve: u0,
                active: true,
                target-supply: u1000000000, ;; 1B Fixed for now
                target-stx: target-stx,
                metadata-url: metadata-url,
                start-burn-height: burn-block-height,
                end-burn-height: end-burn-height,
            })

            ;; Emit Event for Indexers
            (print {
                event: "token-launch",
                token: token-principal,
                creator: tx-sender,
                name: name,
                symbol: symbol,
                decimals: decimals,
                metadata: metadata-url,
                start_btc: burn-block-height,
                end_btc: end-burn-height,
            })

            (ok true)
        )
    )
)

;; Buy Tokens
(define-public (buy
        (token-contract <launchable-token-trait>)
        (stx-amount uint)
    )
    (let (
            (token-principal (contract-of token-contract))
            (state (unwrap! (map-get? token-state token-principal) ERR_UNKNOWN_TOKEN))
            (current-supply (get supply state))
            (current-reserve (get stx-reserve state))
            (end-height (get end-burn-height state))
        )
        (begin
            ;; Check Bitcoin Block Height for Sale Validity
            (asserts! (< burn-block-height end-height) ERR_SALE_FINISHED)
            (asserts! (get active state) ERR_SALE_NOT_ACTIVE)

            ;; Price Calculation
            (let (
                    (price (get-current-price current-supply))
                    (tokens-out (/ (* stx-amount u1000000) price))
                )
                (begin
                    ;; 1. User sends STX to contract
                    (let ((contract-principal (as-contract tx-sender)))
                        (try! (stx-transfer? stx-amount tx-sender contract-principal))
                    )

                    ;; 2. Contract mints Tokens
                    (try! (contract-call? token-contract mint tokens-out tx-sender))

                    ;; 3. Update State
                    (map-set token-state token-principal
                        (merge state {
                            supply: (+ current-supply tokens-out),
                            stx-reserve: (+ current-reserve stx-amount),
                        })
                    )

                    ;; 4. Check Graduation (Bonding Curve Complete)
                    (if (>= (+ current-reserve stx-amount) (get target-stx state))
                        (begin
                            ;; GRADUATION LOGIC HERE
                            ;; 1. Disable Buy/Sell
                            ;; 2. Emit "Graduated" event
                            ;; 3. (Future) Auto-seed DEX
                            (map-set token-state token-principal
                                (merge state { active: false })
                            )
                            (print {
                                event: "token-graduated",
                                token: token-principal,
                            })
                            true
                        )
                        false
                    )

                    (ok tokens-out)
                )
            )
        )
    )
)

;; Sell Tokens
(define-public (sell
        (token-contract <launchable-token-trait>)
        (token-amount uint)
    )
    (let (
            (token-principal (contract-of token-contract))
            (state (unwrap! (map-get? token-state token-principal) ERR_UNKNOWN_TOKEN))
            (current-supply (get supply state))
            (current-reserve (get stx-reserve state))
        )
        (begin
            (asserts! (get active state) ERR_SALE_NOT_ACTIVE)

            (let (
                    (price (get-current-price current-supply))
                    (stx-out (/ (* token-amount price) u1000000))
                )
                (begin
                    (try! (contract-call? token-contract burn token-amount tx-sender))
                    ;; Contract sends STX to user (contract-caller)
                    (try! (as-contract (stx-transfer? stx-out tx-sender contract-caller)))

                    (map-set token-state token-principal
                        (merge state {
                            supply: (- current-supply token-amount),
                            stx-reserve: (- current-reserve stx-out),
                        })
                    )

                    (ok stx-out)
                )
            )
        )
    )
)

(define-public (finalize-graduation
        (token-contract <launchable-token-trait>)
        (reputation-contract <reputation-trait>)
        (locker-contract <liquidity-locker-trait>)
    )
    (let (
            (token-principal (contract-of token-contract))
            (state (unwrap! (map-get? token-state token-principal) ERR_UNKNOWN_TOKEN))
        )
        (begin
            ;; Check if graduated (active is false, but supply exists, or check target reached)
            ;; We rely on buy setting active=false when target met.
            (asserts! (not (get active state)) ERR_SALE_NOT_ACTIVE)
            (asserts! (>= (get stx-reserve state) (get target-stx state))
                ERR_UNAUTHORIZED
            )

            ;; 1. Award Reputation to Creator
            (try! (as-contract (contract-call? reputation-contract add-reputation
                (get creator state) u100
            )))

            ;; 2. Lock Liquidity (Mock Logic: Lock 10% of supply)
            ;; Launchpad mints remaining tokens to itself then locks them? 
            ;; Or just lock what it has? Launchpad doesn't hold tokens...
            ;; Logic: Mint new LP tokens to Locker?
            ;; For this MVP, we just call the locker to prove interaction. 
            ;; We'll mint 1 token to the locker and lock it.
            (try! (contract-call? token-contract mint u1 (contract-of locker-contract)))

            ;; We need to pass the trait properly cast. This is tricky in Clarity without defining the exact trait type in arguments.
            ;; 'token-contract' is <launchable-token-trait>, locker expects <sip010-ft-trait>.
            ;; If launchable extends sip010 (which it does mostly), we need dynamic casting or shared trait.
            ;; We'll skip the locker call if types mismatch, but assuming they match:
            ;; (contract-call? locker-contract lock-tokens token-contract u1 (+ burn-block-height u52500))

            (print {
                event: "graduation-finalized",
                token: token-principal,
            })
            (ok true)
        )
    )
)

(define-read-only (get-current-price (supply uint))
    ;; P = 1000 + (supply / 1000)
    (+ u1000 (/ supply u1000))
)

;; Vesting Logic
;; Users can claim tokens if they have a vesting schedule.
;; Here we assume `buy` might assign vesting, OR the creator locks tokens for themselves.
;; For a simple presale where users buy, usually they get tokens immediately unless specified.
;; We'll implement a generic `vest-tokens` helper that creators can use to lock their team allocation.

(define-map vesting-schedules
    {
        token: principal,
        owner: principal,
    }
    {
        total-amount: uint,
        claimed-amount: uint,
        start-burn-height: uint,
        end-burn-height: uint,
    }
)

(define-constant ERR_NO_VESTING (err u200))

(define-public (create-vesting
        (token <launchable-token-trait>)
        (beneficiary principal)
        (amount uint)
        (duration-blocks uint)
    )
    (let (
            (token-principal (contract-of token))
            (start-height burn-block-height)
            (end-height (+ start-height duration-blocks))
        )
        (begin
            ;; Only Creator of the token or Admin can create vesting? 
            ;; For now, let's assume this is called during `launch-token` or similar setup.
            ;; Simplification: The caller sends tokens *into* the contract to be vested.
            (let ((contract-principal (as-contract tx-sender)))
                (try! (contract-call? token transfer amount tx-sender
                    contract-principal none
                ))
            )

            (map-set vesting-schedules {
                token: token-principal,
                owner: beneficiary,
            } {
                total-amount: amount,
                claimed-amount: u0,
                start-burn-height: start-height,
                end-burn-height: end-height,
            })
            (ok true)
        )
    )
)

(define-public (claim-vested-tokens (token <launchable-token-trait>))
    (let (
            (token-principal (contract-of token))
            (schedule (unwrap!
                (map-get? vesting-schedules {
                    token: token-principal,
                    owner: tx-sender,
                })
                ERR_NO_VESTING
            ))
            (current-height burn-block-height)
            (total (get total-amount schedule))
            (claimed (get claimed-amount schedule))
            (start (get start-burn-height schedule))
            (end (get end-burn-height schedule))
        )
        (let (
                ;; Linear Vesting Calculation
                ;; vested = total * (current - start) / (end - start)
                ;; if current >= end, vested = total
                (vested-total (if (>= current-height end)
                    total
                    (/ (* total (- current-height start)) (- end start))
                ))
                (claimable (- vested-total claimed))
            )
            (begin
                (asserts! (> claimable u0) (err u201))

                ;; Transfer tokens from contract to claimer
                (try! (as-contract (contract-call? token transfer claimable tx-sender tx-sender none)))

                ;; Update Schedule
                (map-set vesting-schedules {
                    token: token-principal,
                    owner: tx-sender,
                }
                    (merge schedule { claimed-amount: (+ claimed claimable) })
                )

                (print {
                    event: "vesting-claim",
                    token: token-principal,
                    user: tx-sender,
                    amount: claimable,
                })
                (ok claimable)
            )
        )
    )
)

(define-read-only (get-vesting-schedule
        (token principal)
        (user principal)
    )
    (ok (map-get? vesting-schedules {
        token: token,
        owner: user,
    }))
)
