// seed.mongo.js
(function () {
  const users = db.getSiblingDB("user_db").users;
  const matches = db.getSiblingDB("player_db").matches;
  const teams = db.getSiblingDB("team_db").teams;
  const tournaments = db.getSiblingDB("tournament_db").tournaments;
  const grounds = db.getSiblingDB("ground_db").grounds;
  const products = db.getSiblingDB("shop_db").products;
  const reports = db.getSiblingDB("admin_db").reports;

  users.updateOne(
    { email: "demo@sports.app" },
    {
      $setOnInsert: {
        email: "demo@sports.app",
        passwordHash: "demo-hash",
        fullName: "Demo User",
        city: "Mumbai",
        preferredSports: ["football", "cricket"],
        skillLevel: "intermediate",
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  grounds.updateOne(
    { name: "Elite Turf 1" },
    { $setOnInsert: { name: "Elite Turf 1", area: "Downtown", city: "Mumbai", hourlyPrice: 1800, createdAt: new Date() } },
    { upsert: true }
  );

  products.updateOne(
    { name: "Football Jersey" },
    { $setOnInsert: { name: "Football Jersey", category: "jersey", price: 35, stock: 100, customizable: true, createdAt: new Date() } },
    { upsert: true }
  );

  matches.updateOne(
    { title: "Sunday Football" },
    { $setOnInsert: { title: "Sunday Football", sport: "football", location: "Mumbai", totalSlots: 14, startsAt: new Date(), visibility: "public", createdAt: new Date() } },
    { upsert: true }
  );

  teams.updateOne(
    { name: "Mumbai Strikers" },
    { $setOnInsert: { name: "Mumbai Strikers", captainId: "demo-user", inviteCode: "STRIKE", members: ["demo-user"], wins: 0, losses: 0, createdAt: new Date() } },
    { upsert: true }
  );

  tournaments.updateOne(
    { name: "City Cup" },
    { $setOnInsert: { name: "City Cup", sport: "football", format: "knockout", city: "Mumbai", createdAt: new Date() } },
    { upsert: true }
  );

  reports.updateOne(
    { type: "seed-check" },
    { $setOnInsert: { type: "seed-check", payload: { note: "seeded" }, status: "open", createdAt: new Date() } },
    { upsert: true }
  );

  print("Mongo seed complete.");
})();
