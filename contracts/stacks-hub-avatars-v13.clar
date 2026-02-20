;; stacks-hub-avatars-v11.clar
;; SIP-009 NFT Contract for Stacks Lab Profile Avatars
;; Allows minting of 100 unique avatars to be used as profile pictures

(impl-trait .sip009-nft-trait-v12.sip009-nft-trait)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-token-exists (err u102))
(define-constant err-token-not-found (err u103))
(define-constant err-sold-out (err u104))

(define-constant MINT-PRICE u100000000) ;; 100 STX
(define-constant MAX-SUPPLY u100)

;; Data Vars
(define-data-var last-token-id uint u0)

;; Store explicit URIs for each token
(define-map token-uris
  uint
  (string-ascii 256)
)

;; NFT Definition
(define-non-fungible-token stacks-lab-avatar uint)

;; Read-only functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (map-get? token-uris token-id))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? stacks-lab-avatar token-id))
)

;; Minting Function
(define-public (mint (uri (string-ascii 256)))
  (let ((next-id (+ (var-get last-token-id) u1)))
    ;; Checks
    (asserts! (<= next-id MAX-SUPPLY) err-sold-out)

    ;; Pay mint price to owner
    (try! (stx-transfer? MINT-PRICE tx-sender contract-owner))

    ;; Mint NFT
    (try! (nft-mint? stacks-lab-avatar next-id tx-sender))

    ;; Update state
    (var-set last-token-id next-id)
    (map-set token-uris next-id uri)

    (ok next-id)
  )
)

;; SIP-009 Transfer
(define-public (transfer
    (token-id uint)
    (sender principal)
    (recipient principal)
  )
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (nft-transfer? stacks-lab-avatar token-id sender recipient)
  )
)
