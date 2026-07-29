# Elevspor Supabase-backend

Dette er MVP-backenden til skoler, medarbejdere, anonyme elevprofiler,
aktivitet, månedlig opgørelse og privat medielager. Den er designet til
Supabase Free Plan og kan senere flyttes til en betalt Supabase-plan uden
ændring af datamodellen.

## Arkitektur

- `auth.users`: Supabase Auth ejer medarbejdernes login og e-mail.
- `schools`: én tenant pr. skole.
- `school_members`: kobler en autentificeret medarbejder til en skole og
  rollen `owner`, `admin` eller `teacher`.
- `school_invitations`: tidsbegrænsede invitationer. Kun SHA-256-hash af
  e-mail og token gemmes.
- `school_bootstraps`: kortlivede, operatøroprettede links til den første
  owner på en ny skole. Kun hashes gemmes.
- `students`: anonym backendprofil. Navn og profilfoto må ikke sendes til
  Supabase; appen kobler sin lokale profil til `local_reference_hash`.
  Nye elever oprettes som `pending` og inaktive, indtil en medarbejder fra
  samme skole godkender dem.
- `student_activities`: hændelser med tidspunkt og valgfri varighed.
- `billing_settings`: versionsstyret pris og aktivitetsgrænse.
- `monthly_report_runs`: frosne månedsopgørelser.
- `report_outbox`: klargjort mailkø. Ingen mail sendes i MVP'en.
- `school-media`: privat Storage-bucket til skolelogoer og
  medarbejderfotos. Elevfotos forbliver lokalt på enheden.

Alle tenanttabeller har Row Level Security. En medarbejder kan kun læse
rækker, hvor vedkommendes `auth.uid()` findes i `school_members`.

## Faktureringsregel

Standardrækken i `billing_settings` siger:

- mindst 1 aktivitet i kalendermåneden
- 10.000 øre = 100 kr. ekskl. moms pr. fakturerbar elev

Reglen ændres ved at lukke den gældende periodes `effective_until` og
indsætte en ny række. Historiske rapporter beholder den pris, de blev
beregnet med.

En elev, der kun er oprettet eller afventer godkendelse, kan ikke skrive
aktivitet og bliver derfor ikke fakturerbar. Først efter lærerens godkendelse
kan eleven starte en samtale, som opretter en aktivitet.

## Lokal opsætning

Krav: Docker og Supabase CLI.

```bash
npx supabase start
npx supabase db reset
npx supabase test db
npm test
```

Studio åbner normalt på `http://127.0.0.1:54323`.

Hvis Docker ikke er tilgængelig, kan Node-testene og web-builden stadig køres,
men migrationen er først fuldt integrationstestet, når `supabase db reset` og
`supabase test db` består mod rigtig Postgres.

## Automatisk deployment til det hostede Supabase-projekt

Elevspor bruger `.github/workflows/deploy-supabase.yml`. Workflowet kører
automatisk, når en migration under `supabase/migrations/` merges til `main`,
og kan også startes manuelt fra GitHub Actions.

Repository Variables:

- `SUPABASE_PROJECT_REF`: projektets ref. Ikke hemmelig.
- `SUPABASE_URL`: Project URL. Må bruges i frontend.
- `SUPABASE_PUBLISHABLE_KEY`: publishable/anon key. Må bruges i frontend,
  fordi RLS håndhæver adgangen.

Repository Secrets:

- `SUPABASE_ACCESS_TOKEN`: Supabase Personal Access Token til CLI-linkning.
- `SUPABASE_DB_PASSWORD`: adgangskoden til projektets Postgres-database.
- `ELEVSPOR_BOOTSTRAP_TOKEN`: et midlertidigt 48-tegns hex-token, når en ny
  Test-Skole skal bootstrap'es. Tokenet udløber efter 24 timer og slettes
  eller udskiftes efter brug.

Workflowet viser aldrig værdierne, bruger ikke `set -x` og sender ikke
hemmeligheder som kommandolinjeargumenter. GitHub maskerer desuden repository
secrets i logs. Efter migration kører workflowet pgTAP-pakken direkte mod
den hostede database. Testdata oprettes i transaktioner og rulles tilbage.

Service-role/secret key bruges ikke til migrationer eller test. Den må aldrig
lægges i frontend, repository, GitHub Variables, logs eller beskeder.

## Første opsætning i et hosted Supabase-projekt

1. Opret et Supabase-projekt i en EU-region, hvis tilgængeligt.
2. Opret et Personal Access Token på
   `https://supabase.com/dashboard/account/tokens`.
3. Find eller nulstil databaseadgangskoden under projektets
   `Database` → `Settings`.
4. Opret de to Repository Secrets under GitHub-repoets
   `Settings` → `Secrets and variables` → `Actions`.
5. Kontrollér de tre Repository Variables samme sted under fanen `Variables`.
6. Start workflowet `Deploy Elevspor database` manuelt første gang.
7. Alternativ lokal nødkørsel:

   ```bash
   npx supabase link --project-ref PROJEKT_REF
   npx supabase db push
   ```

8. Sæt Auth Site URL til `https://nickzen108.github.io/iTalk/`.
9. Sæt redirect URL til samme adresse.
10. Kopiér kun Project URL og publishable/anon key til frontendens lokale
   konfiguration. De værdier er beregnet til klientbrug, når RLS er aktiv.
11. Læg aldrig Personal Access Token, `service_role`/secret key,
    databaseadgangskode eller mailhemmeligheder i frontend eller repoet.

## Login og invitationsbaseret onboarding

1. Platformoperatøren opretter den første owner gennem det beskyttede
   Test-Skole-bootstrap. Offentlige brugere kan ikke oprette skoler.
2. Supabases `Before User Created`-hook afviser alle medarbejderkonti uden
   en gyldig invitation eller bootstrap.
3. En owner/admin kalder `create_school_invitation(school_id, email, role)`.
   RPC'en returnerer invitationstokenet én gang.
4. Den inviterede åbner appens invitationslink, opretter login med samme
   e-mail og appen kalder
   `claim_school_invitation(token)`.

Tokenet udløber efter syv dage. Owner-rollen kan ikke uddeles via invitation.
Roller kommer kun fra serverens `school_members`/invitationer; browseren kan
ikke skrive direkte til medlemsroller. En bruger kan kun tilhøre én skole.

## Elevtilmelding og lærergodkendelse

1. Elevens lokale profil anmoder om adgang gennem `students`. Kun profilens
   SHA-256-reference, fødselsår og tekniske metadata sendes til Supabase.
2. Nye rækker får `approval_status = 'pending'` og `active = false`.
3. Elevområdet låser samtaleøvelser, mens godkendelsen afventer.
4. En indlogget medarbejder fra samme skole godkender via
   `approve_student(student_id)`.
5. RPC'en sætter `approved`, `active`, tidspunkt og godkenderens bruger-id.
6. RLS-politikken for `student_activities` accepterer kun aktivitet, hvis
   elevens skole matcher JWT-brugerens skole, og eleven både er aktiv og
   godkendt.

Backend gemmer fortsat ikke elevnavn eller foto. Derfor vises navnet kun på
den enhed, hvor profilen er oprettet. Denne privacy-first MVP kræver, at
læreren godkender elevprofilen på en skoleenhed, der kender den lokale profil.

## Månedlige rapporter

`prepare_monthly_reports()` beregner den foregående kalendermåned og lægger
én post pr. skole i `report_outbox`. Funktionen kan senere kaldes månedligt
med Supabase Cron. Mailafsendelse er med vilje ikke aktiveret, fordi en
mailudbyder og dens databehandlerforhold først skal godkendes.

Ved senere aktivering:

1. Opret en Edge Function, der læser `report_outbox` med service role.
2. Gem mailudbyderens nøgle som Supabase Secret.
3. Begræns modtageren til den godkendte rapportadresse.
4. Planlæg funktionen med Supabase Cron og Vault.
5. Markér hver køpost `sent` eller `failed` og behold forsøgslog.

## GDPR og sikkerhed før pilot

- Indgå databehandleraftale med Supabase og vælg passende region.
- Udfør en DPIA/risikovurdering, fordi løsningen bruges af børn.
- Dokumentér behandlingsgrundlag, slettefrister og procedurer for
  indsigt/sletning.
- Gem ingen elevnavne, e-mails, fritekstnoter eller samtaleindhold i
  backendens elevtabeller.
- Elevfotos ligger kun lokalt og skal kunne slettes fra enheden.
- Begræns `school-media` til billeder, 5 MB og private signerede links.
- Aktiver e-mailbekræftelse og overvej MFA for owner/admin før drift.
- Test RLS med brugere fra mindst to skoler før pilot.
- Free Plan har ikke point-in-time recovery; etabler en dokumenteret
  eksport/backup-procedure før rigtige skoledata lægges ind.

## Nødvendige oplysninger fra Nicolai

For livekobling kræves:

- Supabase Project URL som GitHub Variable
- Supabase publishable key (eller legacy anon key) som GitHub Variable
- Project ref som GitHub Variable
- Personal Access Token som GitHub Actions-secret
- databaseadgangskode som GitHub Actions-secret
- bekræftelse af valgt Supabase-region og databehandleraftale

Service-role-nøglen skal ikke sendes i chat eller commits. Hvis den senere
kræves til deployment, skal den lægges direkte i Supabase Secrets.

## Flytning til betalt drift

SQL-migrationerne er portable. Opgradering kræver normalt kun valg af plan,
backup/PITR, eventuel brugerdefineret SMTP, overvågning og højere kvoter.
Kør altid migrationer i staging først, tag backup og genkør RLS-testpakken.
