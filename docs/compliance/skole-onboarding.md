# Skole-onboarding: fra nul til godkendt pilot

Brug denne rækkefølge. En teknisk opsætning er ikke det samme som en
GDPR-godkendelse.

## Trin 1 – udpeg ansvarlige

Skolen udfylder:

- Dataansvarlig juridisk enhed: `[UDFYLDES AF SKOLEN]`
- Systemejer: `[NAVN, ROLLE, KONTAKT]`
- Daglig administrator: `[NAVN, ROLLE, KONTAKT]`
- DPO/databeskyttelsesrådgiver: `[NAVN/FUNKTION, KONTAKT]`
- Informationssikkerhed/beredskab: `[KONTAKT]`
- Leverandøransvarlig: `[KONTAKT]`

**STOP:** Ingen rigtige elevdata før systemejer og DPO-kontakt er udpeget.

## Trin 2 – afgræns piloten

- Formål og undervisningsbehov: `[UDFYLDES AF SKOLEN]`
- Elevgruppe, alder og antal: `[UDFYLDES AF SKOLEN]`
- Medarbejdergruppe og antal: `[UDFYLDES AF SKOLEN]`
- Start- og slutdato: `[UDFYLDES AF SKOLEN]`
- Hvilke enheder må anvendes: `[SKOLEEJET/BYOD/BESLUTNING]`
- Er fritekst/samtaleindhold forbudt i backend: `Ja` (nuværende design)
- Skal fødselsår overhovedet bruges: `[JA/NEJ + BEGRUNDELSE]`

Start med færrest mulige elever og kun de data, der er nødvendige.

## Trin 3 – gennemfør leverandørkontrol

Følg [DPA- og leverandørkontrollen](dpa-leverandoerkontrol.md). Vedlæg:

- underskrevet/tiltrådt DPA,
- valgt Supabase-region,
- dateret underdatabehandlerliste,
- dokumenteret vurdering af tredjelandsoverførsler,
- vurdering af leverandørens sikkerhed og skolens egen konfiguration.

**STOP:** Uafklaret tredjelandsoverførsel eller manglende DPA skal afgøres af
skolens DPO/jurafunktion før pilot.

## Trin 4 – fastlæg lovlig behandling

Færdiggør [behandlingsfortegnelsen](behandlingsfortegnelse.md).

Skolen skal selv:

1. vælge og dokumentere behandlingsgrundlag for hvert formål,
2. fastsætte konkrete slettefrister,
3. beslutte procedurer for indsigt, rettelse og sletning,
4. udarbejde information til elev/forældre i klart, alderssvarende sprog.

Brug ikke samtykke som automatisk standard. Hjemlen afhænger bl.a. af
skoleform, formål og national lovgivning og skal vurderes konkret.

## Trin 5 – udfør DPIA-screening og sikkerhedsrisiko

Udfyld [DPIA- og risikovurderingsskabelonen](dpia-risikovurdering.md).
Behandlingen vedrører børn, og løsningen understøtter autistiske elever.
Skolen skal derfor være særlig opmærksom på sårbarhed og på, om brugen kan
afsløre eller udlede helbreds-/støttebehov.

**STOP:** Hvis DPIA er påkrævet, må behandlingen ikke begynde, før DPIA'en er
færdig og høj restrisiko er håndteret. DPO'en skal inddrages.

## Trin 6 – opsæt teknikken

- [ ] Opret Supabase-projekt i den godkendte EU-region.
- [ ] Brug kun Project URL og publishable/anon key i klienten.
- [ ] Læg aldrig databasekodeord, access token eller service-role key i app,
      repository, mails eller chat.
- [ ] Aktivér e-mailbekræftelse; beslut MFA-krav for owner/admin.
- [ ] Opret første owner gennem den beskyttede bootstrap.
- [ ] Invitér kun navngivne medarbejdere; giv mindst mulige rolle.
- [ ] Test Row Level Security med brugere fra to forskellige skoler.
- [ ] Kontrollér, at elevnavn aldrig findes i QR-kode, URL, aktivitet eller
      auditlog.
- [ ] Dokumentér backup, eksport og gendannelsestest. Free Plan har ikke
      point-in-time recovery; skolen skal acceptere eller afhjælpe risikoen.
- [ ] Registrér projekt-id, region, konfigurationsdato og ansvarlig.

Teknisk detailvejledning findes i
[Supabase-backend](../supabase-backend.md).
Den konkrete Free Plan-procedure findes i
[Backup og gendannelse](backup-gendannelse.md).

## Trin 7 – klargør drift

- Indsæt ElevSpor i skolens it-/systemregister.
- Udgiv privatlivsinformation før eller ved indsamling.
- Sørg for en kanal til rettighedsanmodninger.
- Færdiggør [hændelsesberedskabet](haendelsesberedskab.md).
- Lær medarbejdere: del ikke login, brug ikke elevdata i fritekst, fjern
  adgang ved jobskifte, og anmeld mistanke straks.
- Fastlæg kvartalsvis bruger-/rolle-review og årlig leverandør-/DPIA-review.

## Trin 8 – godkend og start

Saml bilagene i [DPO-godkendelsespakken](dpo-godkendelse.md). Pilot starter
først efter et dokumenteret go fra den godkendelsesansvarlige.

## Trin 9 – afslut eller gå i drift

Ved pilotslut:

1. evaluer formål, effekt, fejl og sikkerhedshændelser,
2. luk overflødige konti og adgange,
3. slet pilotdata efter den vedtagne frist eller dokumentér fortsat behov,
4. gentag risiko-/DPIA-vurderingen ved væsentlige ændringer,
5. få ny godkendelse før bredere elevgruppe, nye datatyper eller ny
   leverandør/funktion.

## Kilder

- [Datatilsynet: skoler, oplysningspligt, børn og brud](https://www.datatilsynet.dk/regler-og-vejledning/skoler-og-daginstitutioner)
- [Datatilsynet: dataansvarliges forpligtelser](https://www.datatilsynet.dk/regler-og-vejledning/grundlaeggende-begreber/hvad-er-dine-forpligtelser/den-dataansvarliges-forpligtelser)
- [Supabase: secure configuration](https://supabase.com/docs/guides/security/product-security)
