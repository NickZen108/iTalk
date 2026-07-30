# Backup og gendannelse på Supabase Free Plan

Supabase anbefaler, at Free Plan-projekter regelmæssigt eksporteres med
Supabase CLI og opbevares off-site. ElevSpor sender ikke databasedumps til
GitHub Actions, fordi det ville kopiere elevdata til endnu en leverandør uden
skolens konkrete godkendelse.

## Skolen beslutter før første backup

- Backupansvarlig: `[UDFYLDES AF SKOLEN]`
- Godkendt krypteret lager: `[UDFYLDES AF SKOLEN]`
- Godkendt `age`-modtagernøgle og nøgleejer: `[UDFYLDES AF SKOLEN]`
- Backuphyppighed: `[BESLUTTES – forslag: dagligt under pilot]`
- Opbevaringsperiode: `[BESLUTTES AF SKOLEN/DPO]`
- Dato og ejer for kvartalsvis gendannelsestest: `[UDFYLDES]`

**STOP:** Backupfiler må ikke lægges ukrypteret i GitHub, mail, chat, et
privat drev eller en tilfældig cloudmappe.

## Opret en krypteret backup

Forudsætninger:

1. Supabase CLI er installeret og projektet er linket.
2. `age` er installeret.
3. Skolens godkendte backupmappe findes allerede.
4. Modtagernøglen kan dekrypteres af mindst to navngivne funktioner efter
   skolens nøgleprocedure.

Kør fra projektmappen:

```bash
export ELEVSPOR_BACKUP_DIR="/godkendt/backupmappe"
export ELEVSPOR_BACKUP_AGE_RECIPIENT="age1..."
./scripts/backup-supabase.sh
```

Scriptet:

- eksporterer kun `public`-data fra det linkede projekt,
- opretter dumpet i en privat midlertidig mappe,
- krypterer med skolens offentlige `age`-nøgle,
- laver en SHA-256-kontrolsum,
- fjerner det ukrypterede midlertidige dump.

Det eksporterer ikke Supabase Auth-brugere eller Storage-objekter. Hvis skolen
beslutter, at disse skal kunne gendannes, skal omfang, hjemmel, kryptering og
restore-metode dokumenteres særskilt.

## Gendannelsestest

Gendannelse må aldrig prøves direkte mod produktion.

1. Opret en tom, isoleret testdatabase i skolens godkendte miljø.
2. Anvend ElevSpors migrationer på testdatabasen.
3. Verificér SHA-256-kontrollen.
4. Dekryptér backupen direkte til `psql` uden at gemme en ukrypteret kopi:

   ```bash
   sha256sum --check elevspor-DATO.sql.age.sha256
   age --decrypt --identity /sikker/sti/backup-key.txt \
     elevspor-DATO.sql.age |
     psql "$ELEVSPOR_DISPOSABLE_RESTORE_TEST_URL" \
       --set ON_ERROR_STOP=1 --single-transaction
   ```

5. Kontrollér antal skoler, elever og aktiviteter uden at kopiere navne ind i
   testrapporten.
6. Test login/adgang kun med særskilte testkonti.
7. Slet testdatabasen sikkert efter godkendt resultat.
8. Registrér dato, backup-id, tester, resultat, fejl og korrigerende handling.

## Månedlig kontrol

- [ ] Seneste backup og kontrolsum findes.
- [ ] Backupen ligger i det godkendte lager.
- [ ] Kun godkendte funktioner har nøgleadgang.
- [ ] Udløbne backups er slettet efter politikken.
- [ ] Seneste kvartalsvise gendannelsestest bestod.
- [ ] Ændringer i datatyper, Supabase-plan eller leverandørkæde er vurderet.

## Kilde

- [Supabase: Database Backups](https://supabase.com/docs/guides/platform/backups)
