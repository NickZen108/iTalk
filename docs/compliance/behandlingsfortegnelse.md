# Udkast til behandlingsfortegnelse

Dette er et udfyldningsklart udkast, ikke skolens endelige artikel
30-fortegnelse.

## 1. Ejer og kontakt

- Dataansvarlig: `[SKOLENS/KOMMUNENS JURIDISKE NAVN OG CVR]`
- Adresse: `[UDFYLDES]`
- System-/behandlingsejer: `[UDFYLDES]`
- DPO/kontaktpunkt: `[UDFYLDES]`
- Databehandler: `[KONTRAKTPARTEN I SUPABASE-DPA'EN, UDFYLDES]`
- Systemnavn og version: `ElevSpor [VERSION/RELEASE]`
- Senest revideret: `[DATO]`

## 2. Formål og hjemmel

| Formål | Foreslået afgrænsning | Hjemmel |
| --- | --- | --- |
| Medarbejderadgang | Autentificere og autorisere skolens personale | `[BESLUTTES OG BEGRUNDES AF SKOLEN/DPO]` |
| Elevadministration | Knytte elev til skole, godkende/deaktivere adgang og vise navn til relevante medarbejdere | `[BESLUTTES OG BEGRUNDES AF SKOLEN/DPO]` |
| Samtaletræning | Muliggøre elevens træningsaktivitet og registrere teknisk gennemførelse | `[BESLUTTES OG BEGRUNDES AF SKOLEN/DPO]` |
| Drift/sikkerhed | Adgangsstyring, fejlfinding, audit og håndtering af misbrug | `[BESLUTTES OG BEGRUNDES AF SKOLEN/DPO]` |
| Månedsopgørelse | Opgøre aktive elever, aktivitet og evt. betaling | `[BESLUTTES OG BEGRUNDES AF SKOLEN/DPO]` |

Skolen skal dokumentere den præcise bestemmelse, fx GDPR artikel 6, stk. 1,
og relevant dansk særregel. Vurder særskilt, om oplysninger eller konteksten
afslører særlige kategorier efter artikel 9. At løsningen er tiltænkt
autistiske elever kan gøre denne vurdering væsentlig, selv om en
diagnosekolonne ikke findes.

## 3. Registrerede og data

**Registrerede**

- elever (børn/unge),
- medarbejdere,
- eventuelt forældre/værger, hvis skolen tilføjer deres kontaktoplysninger
  uden for ElevSpor.

**Elevdata i Supabase**

- visningsnavn,
- valgfrit fødselsår,
- pseudonym SHA-256-reference,
- skoletilknytning, elev-id, status og godkendelsestidspunkter,
- aktivitetstype, tidspunkt og valgfri varighed,
- tekniske enheds-id'er, token-hashes, sidste brug og tilbagekaldelse,
- auditoplysninger om deaktivering/sletning.

**Medarbejder-/skoledata**

- login-e-mail i Supabase Auth,
- navn/rolle/skolemedlemskab,
- invitationens e-mail-hash og token-hash,
- administrative handlinger og relevante id'er/tidspunkter.

**Ikke tiltænkt Supabase i nuværende løsning**

- samtaleindhold,
- lærernoter,
- elevfotos,
- elevens e-mail, adresse eller CPR-nummer.

Lokalt lagrede fotos, noter og fremskridt er også personoplysninger og skal
indgå i skolens samlede vurdering, sletning og enhedssikkerhed.

## 4. Modtagere og leverandører

- Interne modtagere: `[LÆRERE/ADMINISTRATION/IT – UDFYLDES]`
- Eksterne databehandlere/underdatabehandlere:
  `[INDSÆT FRA DEN DATEREDE LEVERANDØRKONTROL]`
- Andre modtagere: `[INGEN ELLER UDFYLDES]`
- Offentliggørelse: `Ingen tiltænkt`

## 5. Overførsler uden for EØS

- Forekommer overførsel eller fjernadgang fra tredjeland:
  `[JA/NEJ/UAFKLARET]`
- Lande/modtagere/formål: `[UDFYLDES]`
- Overførselsgrundlag (fx adequacy/SCC): `[UDFYLDES]`
- Transfer Impact Assessment og supplerende foranstaltninger:
  `[VEDLÆGGES HVIS RELEVANT]`

En EU-databaseregion er vigtig, men dokumenterer ikke alene, at ingen
underdatabehandler eller supportfunktion har tredjelandsadgang.

## 6. Slettefrister

Skolen skal indsætte konkrete perioder og en ansvarlig:

| Data | Frist/hændelse | Ansvarlig og kontrol |
| --- | --- | --- |
| Aktiv elevprofil og navn | `[UDFYLDES]` | `[UDFYLDES]` |
| Inaktiv/afsluttet elev | `[UDFYLDES]` | `[UDFYLDES]` |
| Aktivitetsdata | `[UDFYLDES]` | `[UDFYLDES]` |
| Enheds- og adgangsdata | `[UDFYLDES]` | `[UDFYLDES]` |
| Auditlog | `[UDFYLDES EFTER FORMÅL/RISIKO]` | `[UDFYLDES]` |
| Invitationer, udløbet/brugte | `[UDFYLDES]` | `[UDFYLDES]` |
| Medarbejderkonto efter fratrædelse | `[STRAKS DEAKTIVERING; SLETTEFRIST UDFYLDES]` | `[UDFYLDES]` |
| Backup/eksport | `[UDFYLDES]` | `[UDFYLDES]` |
| Lokale fotos/noter/fremskridt | `[UDFYLDES]` | `[UDFYLDES]` |

## 7. Sikkerhedsforanstaltninger

- skoleseparation med database-RLS og servervaliderede RPC'er,
- invitationsbaserede medarbejderkonti og roller,
- hashning af invitations-, adgangs- og enhedstokens,
- private mediefiler og begrænset filtype/størrelse,
- ingen hemmelige backendnøgler i frontend,
- `[SKOLEN UDFYLDER MFA, enhedskryptering, MDM, logging, backup,
  adgangsreview, patching og uddannelse]`.

## 8. Rettigheder og oplysningspligt

- Kanal og identitetskontrol ved anmodninger: `[UDFYLDES]`
- Ansvarlig og svarworkflow: `[UDFYLDES]`
- Privatlivsinformation til elev/forældre: `[VEDLÆGGES]`
- Procedure for indsigt, rettelse, sletning, begrænsning og indsigelse:
  `[VEDLÆGGES]`

Information rettet mod børn skal være klar og let at forstå.

## Godkendelse

- Systemejer: `[NAVN, DATO, SIGNATUR]`
- DPO-høring: `[NAVN, DATO, BEMÆRKNINGER]`
- Juridisk/hjemmelsgodkendelse: `[NAVN, DATO, SIGNATUR]`

## Kilder

- [GDPR artikel 5, 6, 9, 13-22 og 30](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Datatilsynet: skoler og daginstitutioner](https://www.datatilsynet.dk/regler-og-vejledning/skoler-og-daginstitutioner)
- [Datatilsynet: personoplysninger og pseudonymisering](https://www.datatilsynet.dk/regler-og-vejledning/grundlaeggende-begreber/hvad-er-personoplysninger)
