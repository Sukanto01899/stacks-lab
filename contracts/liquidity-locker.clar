
;; liquidity-locker.clar
;; Trustless Liquidity Locker for Stacks Lab
;; Locks SIP-010 tokens until a specific Bitcoin block height.

(use-trait sip010-ft-trait .sip010-ft-trait-v4.sip010-ft-trait)

(define-constant ERR_NOT_AUTHORIZED (err u1000))
(define-constant ERR_LOCK_STILL_ACTIVE (err u1001))
(define-constant ERR_INVALID_LOCK (err u1002))

(define-map locks 
    uint ;; lock-id
    {
        owner: principal,
        token: principal,
        amount: uint,
        unlock-burn-height: uint,
        withdrawn: bool
    }
)

(define-data-var lock-nonce uint u0)

;; Create a new lock
(define-public (lock-tokens (token <sip010-ft-trait>) (amount uint) (unlock-burn-height uint))
    (let
        (
            (lock-id (var-get lock-nonce))
            (sender tx-sender)
        )
        (begin
            ;; Check that unlock height is in future
            (asserts! (> unlock-burn-height burn-block-height) ERR_INVALID_LOCK)
            
            ;; Transfer tokens to this contract (contract principal obtained via as-contract)
            (let ((contract-principal (as-contract tx-sender)))
              (try! (contract-call? token transfer amount sender contract-principal none))
            )
            
            ;; Record Lock
            (map-set locks lock-id {
                owner: sender,
                token: (contract-of token),
                amount: amount,
                unlock-burn-height: unlock-burn-height,
                withdrawn: false
            })
            
            (var-set lock-nonce (+ lock-id u1))
            (ok lock-id)
        )
    )
)

;; Withdraw tokens after lock expires
(define-public (withdraw-tokens (lock-id uint) (token <sip010-ft-trait>))
    (let
        (
            (lock (unwrap! (map-get? locks lock-id) ERR_INVALID_LOCK))
            (owner (get owner lock))
        )
        (begin
            ;; Verify Owner
            (asserts! (is-eq tx-sender owner) ERR_NOT_AUTHORIZED)
            
            ;; Verify Unlock Time (Bitcoin Block Height)
            (asserts! (>= burn-block-height (get unlock-burn-height lock)) ERR_LOCK_STILL_ACTIVE)
            
            ;; Verify not already withdrawn
            (asserts! (not (get withdrawn lock)) ERR_INVALID_LOCK)
            
            ;; Verify Token matches
            (asserts! (is-eq (contract-of token) (get token lock)) ERR_INVALID_LOCK)
            
            ;; Update State
            (map-set locks lock-id (merge lock { withdrawn: true }))
            
            ;; Transfer tokens from contract to owner
            (as-contract
                (contract-call? token transfer (get amount lock) tx-sender owner none))
        )
    )
)

(define-read-only (get-lock (lock-id uint))
    (map-get? locks lock-id)
)
