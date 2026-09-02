// Standalone-Entrypoint (Variante A): eigener Prozess auf PORT.
// Die komplette Logik/Routen liegen in mount.js und werden geteilt mit der
// Variante B (Mount im bestehenden trikot-konfigurator-Prozess).

import express from 'express';
import { createKiezRouter } from './mount.js';

const { router, env } = await createKiezRouter({ root: process.cwd() });

const app = express();
app.set('trust proxy', true);
app.use(router);

app.listen(+env.PORT, () => console.log(`kiez-design-api auf :${env.PORT} — Test-UI: /kiez/test/`));
