const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../webappreviveeeee');
const files = ['routes/api.php', 'app/Services/DriverQueueService.php', 'app/Http/Controllers/Api/DriverApiController.php', 'app/Http/Controllers/Api/TodaQueueController.php', 'app/Providers/AppServiceProvider.php'];
const manifestFile = path.join(__dirname, 'baseline.json');
if (fs.existsSync(manifestFile)) throw new Error('Backend snapshot already exists.');
const baseline = {};
for (const relative of files) {
  const buffer = fs.readFileSync(path.join(root, relative));
  baseline[relative] = crypto.createHash('sha256').update(buffer).digest('hex');
  fs.mkdirSync(path.dirname(path.join(__dirname, relative)), { recursive: true });
  fs.writeFileSync(path.join(__dirname, relative), buffer.toString('utf8').replaceAll('\r\n', '\n'));
}
fs.writeFileSync(manifestFile, JSON.stringify(baseline, null, 2));
