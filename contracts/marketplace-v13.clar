;; marketplace-v9.clar
;; Simple NFT Marketplace for Stacks Lab Avatars
;; Allows listing and buying of SIP-009 NFTs

(use-trait sip009-nft-trait .sip009-nft-trait-v13.sip009-nft-trait)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-listing-not-found (err u102))
(define-constant err-wrong-contract (err u103))
(define-constant err-price-zero (err u104))
(define-constant err-offer-too-low (err u105))
(define-constant err-offer-not-found (err u106))
(define-constant err-offer-expired (err u107))

;; Listing Map
(define-map listings
  uint
  {
    price: uint,
    seller: principal,
  }
)

;; Offers Map
(define-map offers
  { token-id: uint, bidder: principal }
  {
    amount: uint,
    expires-at: uint,  ;; Block height when offer expires
  }
)

;; Read-only functions
(define-read-only (get-listing (token-id uint))
  (map-get? listings token-id)
)

(define-read-only (get-offer (token-id uint) (bidder principal))
  (map-get? offers { token-id: token-id, bidder: bidder })
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

;; Make an offer on a listing
(define-public (make-offer
    (token-id uint)
    (amount uint)
    (expiry-blocks uint)
  )
  (let (
      (listing (unwrap! (map-get? listings token-id) err-listing-not-found))
      (listing-price (get price listing))
      (expiry-height (+ burn-block-height expiry-blocks))
    )
    (begin
      ;; Check if offer meets minimum price (optional - can offer lower)
      ;; Comment this out if you want to allow any offers
      (asserts! (>= amount listing-price) err-offer-too-low)

      ;; Store offer
      (map-set offers 
        { token-id: token-id, bidder: tx-sender }
        {
          amount: amount,
          expires-at: expiry-height,
        }
      )

      (print {
        event: "offer-made",
        token-id: token-id,
        bidder: tx-sender,
        amount: amount,
        expires-at: expiry-height
      })
      
      (ok true)
    )
  )
)

;; Accept an offer
(define-public (accept-offer
    (nft-contract <sip009-nft-trait>)
    (token-id uint)
    (bidder principal)
  )
  (let (
      (listing (unwrap! (map-get? listings token-id) err-listing-not-found))
      (seller (get seller listing))
      (offer (unwrap! (map-get? offers { token-id: token-id, bidder: bidder }) err-offer-not-found))
      (offer-amount (get amount offer))
      (expires-at (get expires-at offer))
    )
    (begin
      ;; Only seller can accept
      (asserts! (is-eq tx-sender seller) err-not-token-owner)
      
      ;; Check if offer expired
      (asserts! (< burn-block-height expires-at) err-offer-expired)

      ;; Pay seller
      (try! (stx-transfer? offer-amount bidder seller))

      ;; Transfer NFT to buyer
      (try! (as-contract (contract-call? nft-contract transfer token-id tx-sender bidder)))

      ;; Remove listing and offer
      (map-delete listings token-id)
      (map-delete offers { token-id: token-id, bidder: bidder })

      (print {
        event: "offer-accepted",
        token-id: token-id,
        seller: seller,
        buyer: bidder,
        amount: offer-amount
      })

      (ok true)
    )
  )
)

;; Cancel an offer
(define-public (cancel-offer (token-id uint))
  (let (
      (offer (unwrap! (map-get? offers { token-id: token-id, bidder: tx-sender }) err-offer-not-found))
    )
    (begin
      ;; Remove offer
      (map-delete offers { token-id: token-id, bidder: tx-sender })

      (print {
        event: "offer-cancelled",
        token-id: token-id,
        bidder: tx-sender
      })

      (ok true)
    )
  )
)

;; Buy NFT (instant buy at listed price)
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

      ;; Remove listing and any offers
      (map-delete listings token-id)
      
      ;; Clean up any existing offers (optional)
      ;; Would need to iterate through offers - for simplicity, leaving as is

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
