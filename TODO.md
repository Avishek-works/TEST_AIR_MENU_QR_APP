# TODO - Customer details validation + payload hardening

- [ ] Inspect current customer details form + server action (already inspected key sections)
- [x] Update `components/order/customer-details-form.tsx`:
  - [x] Phone input: numeric-only, sanitize onChange, max length 10
  - [x] Inline validation message + red border when invalid
  - [x] Disable Place Order until name + phone valid (and cart non-empty)
  - [x] Replace DOB text input with native `type="date"`
  - [x] Error state UX: subtle inline label + focus ring; keep existing premium styling
  - [x] Add console logging around submission (sanitized; no secrets)
  - [x] Disable CTA while submitting + keep spinner/state
- [ ] Update `app/order/actions.ts`:
  - [ ] Add server-side normalization/validation for phone (exactly 10 digits)
  - [ ] Server-side DOB handling for native date input (`YYYY-MM-DD`) and null on empty
  - [ ] Ensure payload hardening: explicit insert payload, do not send unsupported fields (especially `special_instructions`)
  - [ ] Add console logging for validation failures + supabase response errors (no secrets)
- [ ] Run `npm run lint` and `npm run build` (or closest available) to ensure no TS/ESLint errors
- [ ] Verify runtime behavior manually (phone paste, CTA disabled/enabled, order success, errors shown gracefully)
