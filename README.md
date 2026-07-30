# ElevSpor

ElevSpor er en selvstændig, dansk træningsapp, der hjælper autistiske elever med
at øve hverdagssamtaler i trygge og gradvist sværere rammer.

## MVP uden API

- Fem fiktive elevprofiler med lokale fremskridt
- Separat elev- og lærermodul
- Otte sværhedsfaktorer på fem niveauer
- Otte justerbare sværhedsgrader og personlige rekorder under hvert samtaleemne
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

Elevens visningsnavn, en pseudonym elevreference, valgfrit fødselsår,
godkendelsesstatus og aktivitetsmetadata gemmes i Supabase, så skolens
medarbejdere kan genkende eleven på tværs af lærerenheder. Profilfotos,
fremskridt, lærernoter og samtaleindhold gemmes fortsat kun lokalt.
Tekst-til-tale bruger enhedens indbyggede oplæsningsfunktion.

Medarbejderkonti er invitationsbaserede. Backendens SQL-migrationer ligger i
`supabase/`, isolerer skoler med Row Level Security og klargør månedlige
opgørelser uden at sende mail. Se [docs/supabase-backend.md](docs/supabase-backend.md).

Før brug med rigtige elever skal skolen færdiggøre og godkende
[compliance- og onboardingpakken](docs/compliance/README.md). Skabelonerne
erstatter ikke skolens egen juridiske, DPO- eller sikkerhedsmæssige vurdering.
