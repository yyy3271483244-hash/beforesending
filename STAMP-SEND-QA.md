# Stamp & Send verification

The existing stamp section now mounts `StampSendScene`. No new journey route is introduced.
Reference 4 supplies the fixed scene composition; references 2, 3 and 1 supply the open, sealed and back envelope objects respectively. Assets are extracted from the supplied pixels; no generated illustration is used. Existing bilingual header is retained by the application. English uses the local Comico 400 family.

## State

- `sealedAt` and `stampAppliedAt` are independent persisted completion fields.
- `sceneStampNumber` identifies one of eight source stamps; `stampId` also records its identifier.
- `deliveryRecipient` and `deliveryMode: name` feed existing recipient validation.
- Back/front is a local view state, not a replacement for completed steps.
- Send requires seal, postage and a nonblank recipient; writes the existing `sentAt`, `scheduledDeliveryAt`, and send-event shape, then continues to the waiting section. This is local simulated delivery, not real mail.

## Browser checks

Isolated fixture: `/tools/stamp-scene-qa.html`, with production global styles, without reading/writing the user's draft.

- Initial envelope open; Send disabled.
- Wooden seal invalid drop: no completion; object returns.
- Wooden seal valid drop: sealed state and circular seal image.
- Stamp drag: automatic flip; selected stamp placed on back.
- Seal then postage: seal retained.
- Postage then recipient: Send remains disabled until sealed.
- Postage then seal: postage and recipient retained through reverse flip.
- Third-stamp hover: only third image translates; remaining seven report `none`.
- Pen click: editable name field; Enter retains name.
- Complete Send: `sent: true`, completion callback called, exactly one send event.
- All source images load; Comico resolves; no browser errors during tested flow.
- Vite production build passes.

The original full journey/replay acceptance and mobile drag ergonomics are not covered by this focused fixture.
