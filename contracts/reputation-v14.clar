;; reputation-v9.clar
;; On-chain Reputation System for Stacks Lab
;; Tracks user activity and calculates a reputation score

(use-trait sip010-ft-trait .sip010-ft-trait-v14.sip010-ft-trait)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))

;; Reputation Map
;; Principal -> Score (uint)
(define-map user-reputation
  principal
  uint
)

;; Read-only
(define-read-only (get-reputation (user principal))
  (default-to u0 (map-get? user-reputation user))
)

;; Public functions (only callable by trusted contracts/admin in this version)
;; Authorized Contractors (e.g. Launchpad)
(define-map authorized-callers
  principal
  bool
)

(define-public (set-authorized
    (caller principal)
    (status bool)
  )
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set authorized-callers caller status))
  )
)

(define-read-only (is-authorized-caller (caller principal))
  (default-to false (map-get? authorized-callers caller))
)

;; Public functions
(define-public (add-reputation
    (user principal)
    (points uint)
  )
  (let (
      (current-score (get-reputation user))
      (is-auth (is-authorized-caller tx-sender))
    )
    (begin
      ;; Allow Owner OR Authorized Contracts
      (asserts! (or (is-eq tx-sender contract-owner) is-auth) err-owner-only)

      (map-set user-reputation user (+ current-score points))
      (ok true)
    )
  )
)

;; Check sBTC balance and award reputation
;; This would be called periodically or triggered by user
(define-public (verify-sbtc-holding (sbtc-contract <sip010-ft-trait>))
  (let (
      (sender tx-sender)
      (balance (unwrap! (contract-call? sbtc-contract get-balance sender) (err u101)))
    )
    (begin
      ;; If user holds > 1 sBTC, give +50 reputation
      (if (>= balance u100000000)
        (map-set user-reputation sender (+ (get-reputation sender) u50))
        true
      )
      (ok balance)
    )
  )
)
