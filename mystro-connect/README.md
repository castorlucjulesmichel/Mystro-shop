# Mystro Connect

MVP WhatsApp-style + Marketplace + Clips.

## URL GitHub Pages
Si GitHub Pages repo `Mystro-shop` sèvi branch `main` nan root, app la disponib sou:
`https://castorlucjulesmichel.github.io/Mystro-shop/mystro-connect/`

## Fonksyon
- OTP ak nimewo telefòn
- Chat prive
- Marketplace ak foto
- Clips videyo
- Demand depo / retrè / vant
- Admin: kantite itilizatè, videyo, bloke/debloke kont, valide/rejte demand
- Admin ka li sèlman chat itilizatè a rapòte/pataje pou moderasyon

## Admin
UI admin lan mande Firebase custom claim:
`admin: true`

Sa dwe mete ak Firebase Admin SDK oswa yon backend sekirize. Pa mete dwa admin nan JavaScript frontend.

## Rules
Fichye `firestore.rules` ki nan dosye sa a se rules pou Mystro Connect. Pa ranplase rules pwojè Firebase ou san ou verifye yo ansanm ak rules Mystro-Shop ki deja egziste.

## Storage
Foto/videyo itilize Firebase Storage. Ou bezwen règle storage ki pèmèt itilizatè otantifye upload nan:
- mystro-connect/products/{uid}/...
- mystro-connect/clips/{uid}/...

## Sekirite
Chat yo pa E2EE nan MVP sa a. Pou pwodiksyon, ajoute E2EE, anti-spam/rate limits, moderasyon medya, verifikasyon vandè, ak backend pou peman.
