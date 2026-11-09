// Apply these reviewed feature files to the existing sibling Laravel project.
const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve(__dirname, '../../webappreviveeeee');
if (!fs.existsSync(path.join(target, 'artisan'))) throw new Error('Laravel target not found.');
function edit(relative, before, after) {
  const file = path.join(target, relative);
  const original = fs.readFileSync(file, 'utf8');
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const normalized = original.replaceAll('\r\n', '\n');
  if (normalized.includes(after)) return;
  if (!normalized.includes(before)) throw new Error(`Expected source not found: ${relative}`);
  fs.writeFileSync(file, normalized.replace(before, after).replaceAll('\n', newline));
}
for (const relative of [
  'app/Http/Controllers/Api/TodaQueueController.php',
  'database/migrations/2026_11_08_000001_add_queue_removal_audit.php',
  'tests/Feature/TodaQueueRemovalTest.php',
  'tests/Feature/RemovedDriverCheckInTest.php',
]) {
  const source = fs.readFileSync(path.join(__dirname, relative));
  const destination = path.join(target, relative);
  if (fs.existsSync(destination) && !fs.readFileSync(destination).equals(source)) throw new Error(`Refusing to overwrite existing file: ${relative}`);
  fs.writeFileSync(destination, source);
}
edit('routes/api.php', 'use App\\Http\\Controllers\\Api\\DriverApiController;', 'use App\\Http\\Controllers\\Api\\TodaQueueController;\nuse App\\Http\\Controllers\\Api\\DriverApiController;');
edit('routes/api.php', "        Route::get('/queue',", "        Route::get('/queue/removals', [TodaQueueController::class, 'activity']);\n        Route::post('/queue/{entry}/remove', [TodaQueueController::class, 'remove']);\n        Route::get('/queue',");
edit('routes/api.php', "        Route::get('/profile', [DriverApiController::class, 'profile']);", "        Route::get('/profile', [DriverApiController::class, 'profile']);\n        Route::get('/toda', [TodaQueueController::class, 'myToda']);");
edit('app/Http/Controllers/Api/ManagerApiController.php', "                    'queue_status' => $queueEntries->get($driver->id)?->status,", "                    'queue_status' => $queueEntries->get($driver->id)?->status,\n                    'queue_entry_id' => $queueEntries->get($driver->id)?->id,");
edit('app/Models/OrganizationQueueEntry.php', "        'completed_at' => 'datetime',", "        'completed_at' => 'datetime',\n        'removed_at' => 'datetime',");
edit('app/Http/Controllers/Api/ManagerApiController.php',
  '            $alreadyQueued = OrganizationQueueEntry::query()',
  `            $lastEntry = OrganizationQueueEntry::where('organization_id', $organization->id)
                ->where('driver_id', $driver->id)->latest('queue_number')->first();
            if ($lastEntry?->removed_at !== null) {
                throw ValidationException::withMessages(['driver_id' => ['Scan this returning driver\\'s QR code to check in again and join the end of the queue.']]);
            }
            $alreadyQueued = OrganizationQueueEntry::query()`);
console.log('Applied TODA queue removal and manager visibility feature to '+target);
