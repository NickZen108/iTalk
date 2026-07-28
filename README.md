# iTalk

iTalk er en selvstændig, dansk kommunikationsapp til autistiske mennesker og
andre, som har gavn af alternativ og supplerende kommunikation (AAC).

## Første version

- Trykbare kommunikationskort med dansk oplæsning
- Kategorier for hurtige behov, følelser, mad og aktiviteter
- Skriv en valgfri besked og få den læst højt
- Tilføj og slet egne kort
- Gemmer tilpasninger lokalt på enheden
- Rolig tilstand med færre elementer og reducerede animationer
- Offline PWA og selvstændig Android-app

## Udvikling

```bash
npm install
npm run verify
npm run cap:sync
cd android && ./gradlew assembleDebug
```

Åbn `index.html` via en lokal webserver til hurtig webtest. Android APK'en
bygges i `android/app/build/outputs/apk/debug/`.

## Privatliv

MVP'en har ingen konto, annoncer, analyseværktøjer eller cloudlager. Kort og
indstillinger gemmes kun lokalt. Tekst-til-tale bruger enhedens indbyggede
oplæsningsfunktion.
