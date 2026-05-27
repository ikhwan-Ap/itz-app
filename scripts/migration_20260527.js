// Migration: 2026-05-27 — Post security hardening + promo package binding
// Run: mongosh itzapp /var/www/itz-app/scripts/migration_20260527.js

print("=== Migration 2026-05-27 ===");

// 1. Ensure all users have max_history field (default 15)
var r1 = db.users.updateMany(
  {max_history: {$exists: false}},
  {$set: {max_history: 15}}
);
print("Users backfilled max_history: " + r1.modifiedCount);

// 2. Deactivate promos without package_id (new rule: promo must be tied to package)
var r2 = db.promos.updateMany(
  {package_id: {$exists: false}},
  {$set: {active: false}}
);
print("Promos deactivated (no package_id): " + r2.modifiedCount);

var r3 = db.promos.updateMany(
  {package_id: null},
  {$set: {active: false}}
);
print("Promos deactivated (null package_id): " + r3.modifiedCount);

// 3. Ensure indexes for training_results
db.training_results.createIndex({user_id: 1, created_at: -1});
db.training_results.createIndex({user_id: 1, mode: 1});
print("Indexes ensured: training_results");

// 4. Ensure indexes for promos
db.promos.createIndex({code: 1}, {unique: true});
db.promos.createIndex({package_id: 1, active: 1});
print("Indexes ensured: promos");

// 5. Summary
print("\n=== Summary ===");
print("Users total: " + db.users.countDocuments({}));
print("Users with max_history: " + db.users.countDocuments({max_history: {$exists: true}}));
print("Promos active: " + db.promos.countDocuments({active: true}));
print("Promos inactive: " + db.promos.countDocuments({active: false}));
print("Training results: " + db.training_results.countDocuments({}));
print("\n=== Migration complete ===");
