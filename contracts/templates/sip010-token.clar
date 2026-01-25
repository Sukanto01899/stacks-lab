
;; sip010-token.clar
;; Standard SIP-010 Token capable of being launched on Stacks Lab
;; Implements the SIP-010 FT Trait
;; deployed by the User (Founder)

(impl-trait .sip010-ft-trait-v2.sip010-ft-trait)
(impl-trait .launchpad-v2.launchable-token-trait) ;; Refers to the trait defined in launchpad or a separate file

(define-fungible-token hub-token)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-max-supply (err u102))

(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var token-name (string-ascii 32) "Hub Token")
(define-data-var token-symbol (string-ascii 10) "HUB")
(define-data-var token-decimals uint u6)

;; Launchpad Contract Principal - Set this to the actual launchpad contract
(define-constant LAUNCHPAD_CONTRACT .launchpad-v2)

(define-public (mint (amount uint) (recipient principal))
    (begin
        ;; Only the Launchpad can mint (or the owner IF the launchpad hasn't taken over? 
        ;; Actually, for a bonding curve, usually the *Launcher* mints all to the Launchpad, 
        ;; OR the Launchpad has 'mint' authority.
        ;; Implementation: We allow the Launchpad to mint.
        (asserts! (or (is-eq tx-sender contract-owner) (is-eq tx-sender LAUNCHPAD_CONTRACT)) err-owner-only)
        (ft-mint? hub-token amount recipient)
    )
)

(define-public (burn (amount uint) (owner principal))
    (begin
        (asserts! (is-eq tx-sender LAUNCHPAD_CONTRACT) err-owner-only)
        (ft-burn? hub-token amount owner)
    )
)

;; SIP-010 Standard Functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (try! (ft-transfer? hub-token amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(define-read-only (get-name)
    (ok (var-get token-name))
)

(define-read-only (get-symbol)
    (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
    (ok (var-get token-decimals))
)

(define-read-only (get-balance (who principal))
    (ok (ft-get-balance hub-token who))
)

(define-read-only (get-total-supply)
    (ok (ft-get-supply hub-token))
)

(define-read-only (get-token-uri)
    (ok (var-get token-uri))
)

(define-public (set-token-uri (value (string-utf8 256)))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set token-uri (some value))
        (ok true)
    )
)
