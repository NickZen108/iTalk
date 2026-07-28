# iTalk

iTalk er en selvstændig, dansk træningsapp, der hjælper autistiske elever med
at øve hverdagssamtaler i trygge og gradvist sværere rammer.

## MVP uden API

- Fem fiktive elevprofiler med lokale fremskridt
- Separat elev- og lærermodul
- Otte sværhedsfaktorer på fem niveauer
- Faktorbaserede progressionsbjælker og samlet Hero-score
- Fem scenarier: leg, vejvisning, tøjbutik, café og gruppeaktivitet
- Valg mellem AI- eller elevinitiativ ud fra elevens aktuelle niveau
- Lokal, regelbaseret samtalesimulator med forslag til svar
- Samtaler på 1–5 minutter, der bestås ved fuld gennemførelse
- Valg af dansk AI-stemme fra enhedens installerede stemmer
- Lærernoter om status, fremgang og ønsket AI-adfærd
- Lokal lagring, offline PWA og selvstændig Android-app

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

MVP'en har ingen konto, annoncer, analyseværktøjer, API eller cloudlager.
Elevdata, fremskridt og lærernoter gemmes kun lokalt. Tekst-til-tale bruger
enhedens indbyggede oplæsningsfunktion.
