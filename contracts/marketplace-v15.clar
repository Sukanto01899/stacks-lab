;; marketplace-v9.clar
;; Simple NFT Marketplace for Stacks Lab Avatars
;; Allows listing and buying of SIP-009 NFTs

(use-trait sip009-nft-trait .sip009-nft-trait-v15.sip009-nft-trait)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-listing-not-found (err u102))
(define-constant err-wrong-contract (err u103))
(define-constant err-price-zero (err u104))

;; Listing Map
;; Token ID -> { price: uint, seller: principal }
(define-map listings
  uint
  {
    price: uint,
    seller: principal,
  }
)

;; Read-only functions
(define-read-only (get-listing (token-id uint))
  (map-get? listings token-id)
)

;; List NFT for sale
(define-public (list-asset
    (nft-contract <sip009-nft-trait>)
    (token-id uint)
    (price uint)
  )
  (let ((owner (unwrap! (contract-call? nft-contract get-owner token-id) (err u404))))
    (begin
      ;; Verify ownership
      (asserts! (is-eq (some tx-sender) owner) err-not-token-owner)
      (asserts! (> price u0) err-price-zero)

      ;; Transfer NFT to escrow (this contract)
      (let ((contract-principal (as-contract tx-sender)))
        (try! (contract-call? nft-contract transfer token-id tx-sender
          contract-principal
        ))
      )

      ;; Create listing
      (map-set listings token-id {
        price: price,
        seller: tx-sender,
      })
      (ok true)
    )
  )
)

;; Buy NFT
(define-public (buy-asset
    (nft-contract <sip009-nft-trait>)
    (token-id uint)
  )
  (let (
      (listing (unwrap! (map-get? listings token-id) err-listing-not-found))
      (price (get price listing))
      (seller (get seller listing))
    )
    (begin
      ;; Pay seller
      (try! (stx-transfer? price tx-sender seller))

      ;; Transfer NFT to buyer (contract sends to tx-sender)
      (try! (as-contract (contract-call? nft-contract transfer token-id tx-sender tx-sender)))

      ;; Remove listing
      (map-delete listings token-id)
      (ok true)
    )
  )
)

;; Cancel listing
(define-public (cancel-listing
    (nft-contract <sip009-nft-trait>)
    (token-id uint)
  )
  (let (
      (listing (unwrap! (map-get? listings token-id) err-listing-not-found))
      (seller (get seller listing))
    )
    (begin
      ;; Verify seller is the one cancelling
      (asserts! (is-eq tx-sender seller) err-not-token-owner)

      ;; Return NFT to seller (contract sends to seller)
      (try! (as-contract (contract-call? nft-contract transfer token-id tx-sender seller)))

      ;; Remove listing
      (map-delete listings token-id)
      (ok true)
    )
  )
)
