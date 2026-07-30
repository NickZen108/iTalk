# DPIA-screening og risikovurdering

Skabelonen dækker både sikkerhedsrisiko efter GDPR artikel 32 og screening
for konsekvensanalyse efter artikel 35. Skolen ejer vurderingen. DPO'en skal
rådgive og kontrollere, men er ikke systemejerens risikoejer.

## A. Beskriv behandlingen

- Formål: `[UDFYLDES]`
- Elevgruppe/alder/antal: `[UDFYLDES]`
- Skoler/enheder/brugere: `[UDFYLDES]`
- Dataflow fra elev/lærer til Supabase og tilbage: `[VEDLÆG DIAGRAM]`
- Datakategorier og lokal lagring: `[UDFYLDES/SE FORTEGNELSE]`
- Hyppighed og varighed: `[UDFYLDES]`
- Modtagere og geografisk behandling: `[UDFYLDES]`
- Nye funktioner/ændringer siden sidste vurdering: `[UDFYLDES]`

## B. Nødvendighed og proportionalitet

- Hvorfor er elevens navn nødvendigt på tværs af lærerenheder?
  `[BEGRUNDELSE]`
- Kan initialer/pseudonym anvendes i stedet? `[VURDERING]`
- Er fødselsår nødvendigt? `[JA/NEJ + BEGRUNDELSE]`
- Hvorfor er hver aktivitetstype, tidspunkt og varighed nødvendig?
  `[BEGRUNDELSE]`
- Hvilke felter er bevidst fravalgt? `[UDFYLDES]`
- Hvordan opfyldes rettigheder og oplysningspligt? `[UDFYLDES]`
- Hvordan undgås sekundær brug, profilering eller personaleovervågning?
  `[UDFYLDES]`

## C. DPIA-screening

Besvar og begrund:

- [ ] Systematisk vurdering/profilering af elever?
- [ ] Beslutninger med væsentlig effekt på elever?
- [ ] Behandling i stort omfang?
- [ ] Systematisk overvågning?
- [ ] Følsomme eller meget personlige data, herunder oplysninger som direkte
      eller indirekte kan afsløre helbred/diagnose?
- [ ] Sårbare registrerede (her: børn og muligvis elever med særlige behov)?
- [ ] Ny/innovativ teknologi eller ny organisatorisk brug?
- [ ] Sammenstilling med andre skolesystemer?
- [ ] Brug, der kan hindre adgang til undervisning eller rettigheder?
- [ ] Høj risiko ved tab af fortrolighed, integritet eller tilgængelighed?

**Skolens konklusion:** `[DPIA PÅKRÆVET / IKKE PÅKRÆVET]`

**Begrundelse:** `[UDFYLDES]`

**DPO-rådgivning og dato:** `[UDFYLDES]`

Hvis screeningen viser sandsynlig høj risiko, gennemføres en fuld DPIA før
behandlingen. Hvis høj restrisiko ikke kan reduceres, skal skolen vurdere
forudgående høring af Datatilsynet efter artikel 36.

## D. Risikoskala

- Sandsynlighed: 1 usandsynlig, 2 mulig, 3 sandsynlig, 4 meget sandsynlig.
- Konsekvens for eleven: 1 begrænset, 2 mærkbar, 3 alvorlig, 4 meget alvorlig.
- Score = sandsynlighed × konsekvens.
- 1–3 lav, 4–7 middel, 8–11 høj, 12–16 kritisk.

Skolen skal godkende skalaen og kan erstatte den med sin egen metode.

## E. Startregister for risici

Vurder både før og efter foranstaltninger; nedenstående scorer er ikke
forudfyldt, fordi de afhænger af skolens konkrete drift.

| Scenario og mulig skade | Eksisterende/foreslåede foranstaltninger | Før S/K | Restrisiko S/K | Ejer/frists |
| --- | --- | --- | --- | --- |
| Medarbejder fra skole A ser elev i skole B; tab af fortrolighed/stigmatisering | RLS, skoleafgrænsede RPC'er, test med to tenants, kvartalsvis review | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Stjålet/delt medarbejderlogin giver adgang til elevnavne | Invitationsadgang, mindst privilegium, e-mailbekræftelse, MFA-krav, hurtig offboarding | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Elevnavn havner i QR, URL eller log og deles | Tilfældige engangstokens, token-hash, test/scan af logs og URL'er | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Mistet elev-/lærerenhed afslører lokale fotos/noter/fremskridt | Skærmlås, kryptering, MDM, fjernsletning, dataminimering | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Brugen afslører autisme/støttebehov og fører til stigmatisering | Begrænset adgang, neutral navngivning, ingen diagnosefelt, fortrolighedsuddannelse | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Fejl eller angreb ændrer/sletter aktivitet og påvirker undervisning | Validering, audit, backup/eksport, gendannelsestest | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Free Plan-begrænsning giver længere datatab uden PITR | Dokumenteret eksportfrekvens, krypteret backup, testet restore eller accepteret risiko/opgradering | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Forældede brugere beholder adgang | Fratrædelsesflow, ejer af brugerregister, kvartalsvis adgangskontrol | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| For lang opbevaring eller backupkopier hindrer sletning | Konkrete frister, slettejob, backup-livscyklus og kontrolrapport | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Supabase/underdatabehandler behandler i tredjeland uden tilstrækkelig vurdering | EU-region, DPA, dateret liste, overførselsgrundlag, TIA og supplerende tiltag | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Eleven oplever overvågning eller resultat bruges uden for formålet | Klar børneinformation, formålsbegrænsning, ingen rangliste/profilering, klagevej | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |
| Brud opdages/eskaleres for sent | Én kontaktvej, 24/7-modtagelse efter lokal model, 72-timers ur, øvelse | `[ ]/[ ]` | `[ ]/[ ]` | `[ ]` |

Tilføj skolens egne risici, særligt ved integrationer, BYOD, delte tablets,
specialpædagogiske notater eller nye AI-funktioner.

## F. Beslutning

- Samlet restrisiko: `[LAV/MIDDEL/HØJ/KRITISK + BEGRUNDELSE]`
- Udestående foranstaltninger: `[UDFYLDES]`
- Pilotbetingelser: `[UDFYLDES]`
- Systemejer accepterer restrisiko: `[NAVN/DATO/SIGNATUR]`
- Informationssikkerhed godkender: `[NAVN/DATO/SIGNATUR]`
- DPO's råd og eventuelle indsigelser: `[UDFYLDES]`
- Næste review: `[DATO; SAMT VED VÆSENTLIG ÆNDRING]`

## Kilder

- [GDPR artikel 32, 35 og 36](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Datatilsynet: risikovurdering](https://www.datatilsynet.dk/regler-og-vejledning/behandlingssikkerhed/risikovurdering)
- [Datatilsynet: skoler og daginstitutioner](https://www.datatilsynet.dk/regler-og-vejledning/skoler-og-daginstitutioner)
- [Supabase: shared responsibility og SOC 2](https://supabase.com/docs/guides/security/soc-2-compliance)
