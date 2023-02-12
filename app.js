// Import Packages From Server
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

//Database Path
const databasePath = path.join(__dirname, "cricketMatchDetails.db");

// calling Express and define application can accept json
const app = express();
app.use(express.json());

// Initialization of Database
let database = null;

const initializationOfDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is Running at: http://local:3000/")
    );
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};
initializationOfDatabaseAndServer();

// API 1
const playersDetailTableDBobjToServer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const queryToGetAllPlayer = `
    SELECT 
        *
    FROM 
        player_details;`;
  const allPlayerPlayerTable = await database.all(queryToGetAllPlayer);
  response.send(
    allPlayerPlayerTable.map((each) => playersDetailTableDBobjToServer(each))
  );
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const queryToGetIdPlayer = `
    SELECT 
        *
    FROM 
        player_details
    WHERE 
        player_id = ${playerId}`;
  const particularPlayer = await database.get(queryToGetIdPlayer);
  response.send(playersDetailTableDBobjToServer(particularPlayer));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const queryToUpdatePlayerName = `
    UPDATE 
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = '${playerId}';`;
  await database.run(queryToUpdatePlayerName);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const queryToGetMatch = `
  SELECT *
  FROM match_details 
  WHERE match_id = '${matchId}'`;
  const specificMatch = await database.get(queryToGetMatch);
  response.send({
    matchId: specificMatch.match_id,
    match: specificMatch.match,
    year: specificMatch.year,
  });
});

// API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const queryToSelectMatch = `
  SELECT 
    match_details.match_id AS matchId, 
    match_details.match AS match, 
    match_details.year AS year
  FROM 
    match_details INNER JOIN player_match_score ON 
    match_details.match_id = player_match_score.match_id
  WHERE
    player_match_score.player_id = '${playerId}'`;
  const selectMatchAsPlayer = await database.all(queryToSelectMatch);
  response.send(selectMatchAsPlayer);
});

// API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const queryToGetplayerAccMatch = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName
    FROM
        player_details INNER JOIN player_match_score ON 
        player_details.player_id = player_match_score.player_id
    WHERE
        player_match_score.match_id = '${matchId}'`;
  const allPlayerAccMatch = await database.all(queryToGetplayerAccMatch);
  response.send(allPlayerAccMatch);
});

// API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const queryToGetStatics = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM 
        player_match_score JOIN player_details ON 
        player_match_score.player_id = player_details.player_id
    WHERE 
        playerId = '${playerId}'`;
  const statistics = await database.get(queryToGetStatics);
  response.send(statistics);
});

module.exports = app;
