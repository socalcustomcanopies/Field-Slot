# Security Specification - FieldSlot

## Data Invariants
1. A Slot cannot be booked if it's already in 'booked' status.
2. A Team can only be modified by its manager.
3. A Booking must match the price of the Slot.
4. Timestamps must be server-generated.

## The "Dirty Dozen" Payloads (Deny these)
1. **Identity Spoofing**: Attempt to create a Team with a `managerId` that is not the current user's UID.
2. **Double Booking**: Attempt to update a Slot with `status: 'booked'` when it's already `status: 'booked'`.
3. **Price Manipulation**: Attempt to book a Slot by sending a Booking with a lower amount than the Slot's price.
4. **Role Escalation**: Attempt to modify the `managerId` of a Team after creation.
5. **Ghost Fields**: Attempt to add `isAdmin: true` to a Team document.
6. **Time Poisoning**: Sending a `createdAt` timestamp from the future in a Booking.
7. **Cross-User Read**: User A trying to read User B's private `Booking` document.
8. **Invalid ID**: Using a 1MB string as a `teamId`.
9. **Status Jumping**: Attempting to set a Booking to `confirmed` directly from the client without going through the pending phase (if logic requires it).
10. **Field Modification**: Attempting to change the `fieldId` of a Slot through the booking flow.
11. **Negative Price**: Creating a Field with a negative `price` or a Slot with negative `price`.
12. **Orphaned Registration**: Creating a Slot for a `fieldId` that doesn't exist.

## Test Runner Plan
I will implement `firestore.rules` and verify them manually against these principles.
