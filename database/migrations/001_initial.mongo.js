// 001_initial.mongo.js
// Idempotent index bootstrap for all services.

(function () {
  const plans = [
    ["user_db", "users", [{ email: 1 }, { city: 1 }, { preferredSports: 1 }], [{ unique: true }, {}, {}]],
    ["player_db", "matches", [{ sport: 1, location: 1 }, { startsAt: 1 }], [{}, {}]],
    ["team_db", "teams", [{ inviteCode: 1 }, { captainId: 1 }], [{ unique: true }, {}]],
    ["tournament_db", "tournaments", [{ sport: 1 }, { city: 1 }], [{}, {}]],
    ["ground_db", "grounds", [{ name: "text", area: "text", city: "text" }], [{}]],
    ["shop_db", "products", [{ category: 1 }, { createdAt: -1 }], [{}, {}]],
    ["admin_db", "reports", [{ status: 1 }, { createdAt: -1 }], [{}, {}]]
  ];

  plans.forEach(([dbName, coll, indexes, options]) => {
    const dbRef = db.getSiblingDB(dbName);
    dbRef.createCollection(coll);
    indexes.forEach((keys, i) => dbRef.getCollection(coll).createIndex(keys, options[i] || {}));
    print(`Initialized ${dbName}.${coll}`);
  });
})();
