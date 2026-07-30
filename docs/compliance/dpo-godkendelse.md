# DPO- og ledelsesgodkendelsespakke

Dette dokument er forsiden til skolens beslutningsmappe. DPO'en rådgiver og
overvåger; den formelle go/no-go skal træffes af den ansvarlige funktion efter
skolens styringsmodel.

## Beslutning

- Dataansvarlig: `[UDFYLDES]`
- System-/behandlingsejer: `[UDFYLDES]`
- Pilotens omfang og periode: `[UDFYLDES]`
- Release/version og Supabase project ref: `[UDFYLDES]`
- Beslutningsdato: `[UDFYLDES]`
- Resultat: `[GO / BETINGET GO / NO-GO]`

## Bilagskontrol

- [ ] Formål, målgruppe og dataminimering er beskrevet.
- [ ] Dataflow og teknisk arkitektur er vedlagt.
- [ ] [Behandlingsfortegnelse](behandlingsfortegnelse.md) er færdig.
- [ ] Behandlingsgrundlag, inkl. eventuel artikel 9-hjemmel, er skriftligt
      godkendt.
- [ ] Privatlivsinformation til elever/forældre er vedlagt og
      alderssvarende.
- [ ] Supabase-DPA og tiltrædelsesbevis er vedlagt.
- [ ] Region-, underdatabehandler- og tredjelandskontrol er færdig.
- [ ] DPIA-screening og sikkerhedsrisiko er vedlagt.
- [ ] Eventuel fuld DPIA og DPO-rådgivning er vedlagt.
- [ ] Høj restrisiko er fjernet, accepteret på korrekt niveau eller håndteret
      efter artikel 36.
- [ ] Slettefrister, sletteansvarlig og backup-livscyklus er fastlagt.
- [ ] Rettighedsprocedure og kontaktpunkt er klar.
- [ ] Hændelsesberedskab og 72-timersvej er øvet.
- [ ] Tenant-/RLS-, autorisations- og gendannelsestest er bestået og
      dokumenteret.
- [ ] Medarbejder-onboarding/offboarding, MFA og adgangsreview er fastlagt.
- [ ] Kendte Free Plan-begrænsninger er accepteret eller afhjulpet.

## DPO-spørgsmål

1. Er formål og nødvendighed tilstrækkeligt konkrete?
   `[DPO-SVAR]`
2. Er hjemmel og mulig behandling af helbredsrelaterede oplysninger korrekt
   vurderet? `[DPO-SVAR]`
3. Er information til børn/forældre klar og fuldstændig? `[DPO-SVAR]`
4. Er databehandler-/underdatabehandler- og tredjelandsforhold acceptable?
   `[DPO-SVAR]`
5. Er DPIA-konklusionen og restrisikoen forsvarlig? `[DPO-SVAR]`
6. Er sletning, rettigheder og brudberedskab operationelt? `[DPO-SVAR]`
7. Hvilke betingelser skal være opfyldt før start? `[DPO-SVAR]`

## Åbne betingelser

| Betingelse | Ejer | Frist | Bevis | Lukket/godkendt |
| --- | --- | --- | --- | --- |
| `[UDFYLDES]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

En “betinget go” må have en udløbsdato og må ikke bruges til at omgå et
STOP-punkt.

## Sign-off

- Systemejer, go/no-go: `[NAVN, ROLLE, DATO, SIGNATUR]`
- Informationssikkerhed: `[NAVN, ROLLE, DATO, SIGNATUR]`
- Juridisk/indkøb: `[NAVN, ROLLE, DATO, SIGNATUR]`
- DPO rådgivet/hørt: `[NAVN, DATO, SIGNATUR, EVENTUELLE FORBEHOLD]`
- Pilotansvarlig har modtaget betingelser: `[NAVN, DATO, SIGNATUR]`

## Efter godkendelse

- Første adgangsreview: `[DATO]`
- Første slette-/backupkontrol: `[DATO]`
- Første beredskabsøvelse: `[DATO]`
- Næste leverandør-/underdatabehandlerreview: `[DATO]`
- Næste DPIA-/risikoreview: `[DATO]`
- Hændelser eller væsentlige ændringer udløser review med det samme.

## Kilder

- [GDPR artikel 24, 28, 30, 32-36 og 37-39](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Datatilsynet: den dataansvarliges forpligtelser](https://www.datatilsynet.dk/regler-og-vejledning/grundlaeggende-begreber/hvad-er-dine-forpligtelser/den-dataansvarliges-forpligtelser)
- [Datatilsynet: skoler og daginstitutioner](https://www.datatilsynet.dk/regler-og-vejledning/skoler-og-daginstitutioner)
