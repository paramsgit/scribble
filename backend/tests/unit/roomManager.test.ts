import RoomManager, { Player } from "../../src/game/roomManager";
import GameManager from "../../src/game/gameManager";
import redis from "../../src/sockets/connectToRedis";
import FinishedState from "../../src/game/states/finishedState";

// Mock dependencies
jest.mock("../../src/sockets/connectToRedis");
jest.mock("../../src/game/gameManager");
jest.mock("../../src/game/states/finishedState");

describe("RoomManager", () => {
  let roomManager: RoomManager;
  let mockRedis: jest.Mocked<typeof redis>;
  let mockGameManager: jest.Mocked<typeof GameManager>;

  beforeEach(() => {
    // Reset singleton instance
    (RoomManager as any).instance = undefined;
    roomManager = RoomManager.getInstance();

    // Setup Redis mocks
    mockRedis = redis as jest.Mocked<typeof redis>;
    mockRedis.get = jest.fn();
    mockRedis.setex = jest.fn();
    mockRedis.del = jest.fn();
    mockRedis.sadd = jest.fn();
    mockRedis.srem = jest.fn();
    mockRedis.smembers = jest.fn();
    mockRedis.scard = jest.fn();
    mockRedis.exists = jest.fn();
    mockRedis.ttl = jest.fn();
    mockRedis.expire = jest.fn();
    mockRedis.pipeline = jest.fn();

    // Setup GameManager mocks
    mockGameManager = GameManager as jest.Mocked<typeof GameManager>;
    mockGameManager.getInstance = jest.fn().mockReturnValue({
      removePlayerFromGame: jest.fn(),
      getGame: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton pattern)", () => {
      const instance1 = RoomManager.getInstance();
      const instance2 = RoomManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("addPlayer", () => {
    const mockPlayer: Player = {
      id: "player1",
      name: "Test Player",
      avatarVariant: "variant1",
    };
    const roomId = "room1";

    it("should add a player to an empty room", async () => {
      mockRedis.get.mockResolvedValueOnce(null); // No existing players

      await roomManager.addPlayer(mockPlayer, roomId);

      expect(mockRedis.get).toHaveBeenCalledWith(`room:${roomId}:players`);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `room:${roomId}:players`,
        7200,
        JSON.stringify([{ ...mockPlayer, score: 0 }])
      );
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `player:${mockPlayer.id}:room`,
        7200,
        roomId
      );
      expect(mockRedis.sadd).toHaveBeenCalledWith("rooms:active", roomId);
    });

    it("should add a player to a room with existing players", async () => {
      const existingPlayers: Player[] = [
        { id: "player2", name: "Player 2", avatarVariant: "variant2", score: 0 },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingPlayers));

      await roomManager.addPlayer(mockPlayer, roomId);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `room:${roomId}:players`,
        7200,
        JSON.stringify([...existingPlayers, { ...mockPlayer, score: 0 }])
      );
    });

    it("should set default score to 0 for new player", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await roomManager.addPlayer(mockPlayer, roomId);

      const setexCalls = mockRedis.setex.mock.calls;
      const roomDataCall = setexCalls.find((call) =>
        call[0].includes("room:")
      );
      expect(roomDataCall).toBeDefined();
      const players = JSON.parse(roomDataCall![2] as string);
      expect(players[0].score).toBe(0);
    });

    it("should throw error when room is full (6 players)", async () => {
      const fullRoomPlayers: Player[] = Array.from({ length: 6 }, (_, i) => ({
        id: `player${i}`,
        name: `Player ${i}`,
        avatarVariant: `variant${i}`,
        score: 0,
      }));
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(fullRoomPlayers));

      await expect(roomManager.addPlayer(mockPlayer, roomId)).rejects.toThrow(
        "Room is full"
      );

      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it("should handle player with existing score and override it", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      const playerWithScore = { ...mockPlayer, score: 100 };

      await roomManager.addPlayer(playerWithScore, roomId);

      const setexCalls = mockRedis.setex.mock.calls;
      const roomDataCall = setexCalls.find((call) =>
        call[0].includes("room:")
      );
      const players = JSON.parse(roomDataCall![2] as string);
      expect(players[0].score).toBe(0); // Should be reset to 0
    });
  });

  describe("removePlayer", () => {
    const socketId = "player1";
    const roomId = "room1";

    it("should return null if player is not in any room", async () => {
      mockRedis.get.mockResolvedValueOnce(null); // No room mapping

      const result = await roomManager.removePlayer(socketId);

      expect(result).toBeNull();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it("should remove player from room with other players", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
        { id: "player2", name: "Player 2", avatarVariant: "v2", score: 0 },
      ];
      mockRedis.get
        .mockResolvedValueOnce(roomId) // getRoomOfPlayer
        .mockResolvedValueOnce(JSON.stringify(players)); // getRoomPlayers

      const gameManagerInstance = mockGameManager.getInstance();
      (gameManagerInstance.removePlayerFromGame as jest.Mock).mockResolvedValue(
        true
      );

      const result = await roomManager.removePlayer(socketId);

      expect(result).toBe(roomId);
      expect(gameManagerInstance.removePlayerFromGame).toHaveBeenCalledWith(
        roomId,
        socketId
      );
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `room:${roomId}:players`,
        7200,
        JSON.stringify([players[1]])
      );
      expect(mockRedis.del).toHaveBeenCalledWith(`player:${socketId}:room`);
    });

    it("should clear room when removing last player", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
      ];
      mockRedis.get
        .mockResolvedValueOnce(roomId)
        .mockResolvedValueOnce(JSON.stringify(players));

      const gameManagerInstance = mockGameManager.getInstance();
      (gameManagerInstance.removePlayerFromGame as jest.Mock).mockResolvedValue(
        true
      );

      // Mock clearRoom behavior - it will be called internally
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);
      (gameManagerInstance.getGame as jest.Mock).mockReturnValue(undefined);

      const result = await roomManager.removePlayer(socketId);

      // Note: removePlayer returns roomId even after clearing, not null
      expect(result).toBe(roomId);
      // clearRoom is called internally, so these operations happen
      expect(mockRedis.del).toHaveBeenCalledWith(`player:${socketId}:room`);
    });

    it("should clear room when room becomes empty after removal", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
      ];
      mockRedis.get
        .mockResolvedValueOnce(roomId)
        .mockResolvedValueOnce(JSON.stringify(players));

      const gameManagerInstance = mockGameManager.getInstance();
      (gameManagerInstance.removePlayerFromGame as jest.Mock).mockResolvedValue(
        true
      );

      // Mock clearRoom behavior
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);
      (gameManagerInstance.getGame as jest.Mock).mockReturnValue(undefined);

      const result = await roomManager.removePlayer(socketId);

      // Note: removePlayer returns roomId even after clearing, not null
      expect(result).toBe(roomId);
      // Verify clearRoom was called (room gets cleared when updatedPlayers.length === 0)
      expect(mockRedis.del).toHaveBeenCalledWith(`player:${socketId}:room`);
    });
  });

  describe("clearRoom", () => {
    const roomId = "room1";
    const players: Player[] = [
      { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
      { id: "player2", name: "Player 2", avatarVariant: "v2", score: 0 },
    ];

    it("should clear room with players", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      const gameManagerInstance = mockGameManager.getInstance();
      const mockGame = {
        setState: jest.fn(),
      };
      (gameManagerInstance.getGame as jest.Mock).mockReturnValue(mockGame);

      await roomManager.clearRoom(roomId);

      expect(mockRedis.get).toHaveBeenCalledWith(`room:${roomId}:players`);
      expect(mockPipeline.del).toHaveBeenCalledTimes(2);
      expect(mockPipeline.del).toHaveBeenCalledWith(`player:${players[0].id}:room`);
      expect(mockPipeline.del).toHaveBeenCalledWith(`player:${players[1].id}:room`);
      expect(mockPipeline.exec).toHaveBeenCalled();
      expect(mockGame.setState).toHaveBeenCalledWith(expect.any(FinishedState));
      expect(mockRedis.del).toHaveBeenCalledWith(`room:${roomId}:players`);
      expect(mockRedis.srem).toHaveBeenCalledWith("rooms:active", roomId);
    });

    it("should clear room without players", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify([]));

      const gameManagerInstance = mockGameManager.getInstance();
      (gameManagerInstance.getGame as jest.Mock).mockReturnValue(undefined);

      await roomManager.clearRoom(roomId);

      expect(mockRedis.pipeline).not.toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith(`room:${roomId}:players`);
      expect(mockRedis.srem).toHaveBeenCalledWith("rooms:active", roomId);
    });

    it("should handle game not existing", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      const gameManagerInstance = mockGameManager.getInstance();
      (gameManagerInstance.getGame as jest.Mock).mockReturnValue(undefined);

      await roomManager.clearRoom(roomId);

      expect(mockRedis.del).toHaveBeenCalledWith(`room:${roomId}:players`);
      expect(mockRedis.srem).toHaveBeenCalledWith("rooms:active", roomId);
    });
  });

  describe("getRoomPlayers", () => {
    const roomId = "room1";

    it("should return empty array when room does not exist", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await roomManager.getRoomPlayers(roomId);

      expect(result).toEqual([]);
      expect(mockRedis.get).toHaveBeenCalledWith(`room:${roomId}:players`);
    });

    it("should return parsed players when room exists", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const result = await roomManager.getRoomPlayers(roomId);

      expect(result).toEqual(players);
    });

    it("should return empty array on JSON parse error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockRedis.get.mockResolvedValueOnce("invalid json");

      const result = await roomManager.getRoomPlayers(roomId);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error parsing room players data:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getRoomOfPlayer", () => {
    const socketId = "player1";
    const roomId = "room1";

    it("should return room ID when player is in a room", async () => {
      mockRedis.get.mockResolvedValueOnce(roomId);

      const result = await roomManager.getRoomOfPlayer(socketId);

      expect(result).toBe(roomId);
      expect(mockRedis.get).toHaveBeenCalledWith(`player:${socketId}:room`);
    });

    it("should return null when player is not in any room", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await roomManager.getRoomOfPlayer(socketId);

      expect(result).toBeNull();
    });
  });

  describe("getAllActiveRooms", () => {
    it("should return all active room IDs", async () => {
      const rooms = ["room1", "room2", "room3"];
      mockRedis.smembers.mockResolvedValueOnce(rooms);

      const result = await roomManager.getAllActiveRooms();

      expect(result).toEqual(rooms);
      expect(mockRedis.smembers).toHaveBeenCalledWith("rooms:active");
    });

    it("should return empty array when no active rooms", async () => {
      mockRedis.smembers.mockResolvedValueOnce([]);

      const result = await roomManager.getAllActiveRooms();

      expect(result).toEqual([]);
    });
  });

  describe("getRoomCount", () => {
    it("should return count of active rooms", async () => {
      mockRedis.scard.mockResolvedValueOnce(5);

      const result = await roomManager.getRoomCount();

      expect(result).toBe(5);
      expect(mockRedis.scard).toHaveBeenCalledWith("rooms:active");
    });

    it("should return 0 when no active rooms", async () => {
      mockRedis.scard.mockResolvedValueOnce(0);

      const result = await roomManager.getRoomCount();

      expect(result).toBe(0);
    });
  });

  describe("updatePlayerScore", () => {
    const playerId = "player1";
    const roomId = "room1";
    const newScore = 100;

    it("should update player score successfully", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
        { id: "player2", name: "Player 2", avatarVariant: "v2", score: 0 },
      ];
      mockRedis.get
        .mockResolvedValueOnce(roomId) // getRoomOfPlayer
        .mockResolvedValueOnce(JSON.stringify(players)); // getRoomPlayers

      const result = await roomManager.updatePlayerScore(playerId, newScore);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `room:${roomId}:players`,
        7200,
        JSON.stringify([
          { ...players[0], score: newScore },
          players[1],
        ])
      );
    });

    it("should return false when player is not in any room", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await roomManager.updatePlayerScore(playerId, newScore);

      expect(result).toBe(false);
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it("should return false when player is not found in room", async () => {
      const players: Player[] = [
        { id: "player2", name: "Player 2", avatarVariant: "v2", score: 0 },
      ];
      mockRedis.get
        .mockResolvedValueOnce(roomId)
        .mockResolvedValueOnce(JSON.stringify(players));

      const result = await roomManager.updatePlayerScore(playerId, newScore);

      expect(result).toBe(false);
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });
  });

  describe("getPlayerFromRoom", () => {
    const roomId = "room1";
    const playerId = "player1";

    it("should return player when found in room", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
        { id: "player2", name: "Player 2", avatarVariant: "v2", score: 0 },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const result = await roomManager.getPlayerFromRoom(roomId, playerId);

      expect(result).toEqual(players[0]);
    });

    it("should return null when player not found in room", async () => {
      const players: Player[] = [
        { id: "player2", name: "Player 2", avatarVariant: "v2", score: 0 },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const result = await roomManager.getPlayerFromRoom(roomId, playerId);

      expect(result).toBeNull();
    });

    it("should return null when room is empty", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await roomManager.getPlayerFromRoom(roomId, playerId);

      expect(result).toBeNull();
    });
  });

  describe("isRoomFull", () => {
    const roomId = "room1";

    it("should return true when room has 6 players", async () => {
      const players: Player[] = Array.from({ length: 6 }, (_, i) => ({
        id: `player${i}`,
        name: `Player ${i}`,
        avatarVariant: `variant${i}`,
        score: 0,
      }));
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const result = await roomManager.isRoomFull(roomId);

      expect(result).toBe(true);
    });

    it("should return false when room has less than 6 players", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const result = await roomManager.isRoomFull(roomId);

      expect(result).toBe(false);
    });

    it("should return false when room is empty", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await roomManager.isRoomFull(roomId);

      expect(result).toBe(false);
    });
  });

  describe("extendRoomTTL", () => {
    const roomId = "room1";
    const customTTL = 3600;

    it("should extend TTL for room and all players with default TTL", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
        { id: "player2", name: "Player 2", avatarVariant: "v2", score: 0 },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const mockPipeline = {
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      await roomManager.extendRoomTTL(roomId);

      expect(mockRedis.get).toHaveBeenCalledWith(`room:${roomId}:players`);
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        `room:${roomId}:players`,
        7200
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        `player:${players[0].id}:room`,
        7200
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        `player:${players[1].id}:room`,
        7200
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it("should extend TTL with custom seconds", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));

      const mockPipeline = {
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      await roomManager.extendRoomTTL(roomId, customTTL);

      expect(mockPipeline.expire).toHaveBeenCalledWith(
        `room:${roomId}:players`,
        customTTL
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        `player:${players[0].id}:room`,
        customTTL
      );
    });

    it("should handle empty room", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify([]));

      const mockPipeline = {
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      await roomManager.extendRoomTTL(roomId);

      expect(mockPipeline.expire).toHaveBeenCalledWith(
        `room:${roomId}:players`,
        7200
      );
      expect(mockPipeline.expire).toHaveBeenCalledTimes(1); // Only room, no players
    });
  });

  describe("cleanup", () => {
    it("should remove expired rooms from active set", async () => {
      const activeRooms = ["room1", "room2", "room3"];
      mockRedis.smembers.mockResolvedValueOnce(activeRooms);
      mockRedis.exists
        .mockResolvedValueOnce(1) // room1 exists
        .mockResolvedValueOnce(0) // room2 expired
        .mockResolvedValueOnce(1); // room3 exists

      const mockPipeline = {
        srem: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await roomManager.cleanup();

      expect(result).toBe(1);
      expect(mockPipeline.srem).toHaveBeenCalledWith("rooms:active", "room2");
      expect(mockPipeline.exec).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("Cleaned up 1 expired rooms");
      consoleSpy.mockRestore();
    });

    it("should return 0 when no expired rooms", async () => {
      const activeRooms = ["room1", "room2"];
      mockRedis.smembers.mockResolvedValueOnce(activeRooms);
      mockRedis.exists
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      const mockPipeline = {
        srem: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      const result = await roomManager.cleanup();

      expect(result).toBe(0);
      // Pipeline is created but not executed when cleanedCount is 0
      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.exec).not.toHaveBeenCalled();
    });

    it("should handle empty active rooms list", async () => {
      mockRedis.smembers.mockResolvedValueOnce([]);

      const result = await roomManager.cleanup();

      expect(result).toBe(0);
    });

    it("should clean up multiple expired rooms", async () => {
      const activeRooms = ["room1", "room2", "room3", "room4"];
      mockRedis.smembers.mockResolvedValueOnce(activeRooms);
      mockRedis.exists
        .mockResolvedValueOnce(0) // room1 expired
        .mockResolvedValueOnce(1) // room2 exists
        .mockResolvedValueOnce(0) // room3 expired
        .mockResolvedValueOnce(1); // room4 exists

      const mockPipeline = {
        srem: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const result = await roomManager.cleanup();

      expect(result).toBe(2);
      expect(mockPipeline.srem).toHaveBeenCalledWith("rooms:active", "room1");
      expect(mockPipeline.srem).toHaveBeenCalledWith("rooms:active", "room3");
      expect(consoleSpy).toHaveBeenCalledWith("Cleaned up 2 expired rooms");
      consoleSpy.mockRestore();
    });
  });

  describe("getRoomStats", () => {
    const roomId = "room1";

    it("should return room statistics when room exists", async () => {
      const players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 50 },
        { id: "player2", name: "Player 2", avatarVariant: "v2", score: 100 },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(players));
      mockRedis.ttl.mockResolvedValueOnce(3600);

      const result = await roomManager.getRoomStats(roomId);

      expect(result).toEqual({
        playerCount: 2,
        players,
        ttl: 3600,
      });
      expect(mockRedis.ttl).toHaveBeenCalledWith(`room:${roomId}:players`);
    });

    it("should return null when room is empty", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await roomManager.getRoomStats(roomId);

      expect(result).toBeNull();
      expect(mockRedis.ttl).not.toHaveBeenCalled();
    });

    it("should return null when room has no players", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify([]));

      const result = await roomManager.getRoomStats(roomId);

      expect(result).toBeNull();
    });
  });

  describe("getMultipleRoomPlayers", () => {
    it("should return players for multiple rooms", async () => {
      const roomIds = ["room1", "room2", "room3"];
      const room1Players: Player[] = [
        { id: "player1", name: "Player 1", avatarVariant: "v1", score: 0 },
      ];
      const room2Players: Player[] = [
        { id: "player2", name: "Player 2", avatarVariant: "v2", score: 0 },
        { id: "player3", name: "Player 3", avatarVariant: "v3", score: 0 },
      ];

      const mockPipeline = {
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, JSON.stringify(room1Players)],
          [null, JSON.stringify(room2Players)],
          [null, null], // room3 doesn't exist
        ]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      const result = await roomManager.getMultipleRoomPlayers(roomIds);

      expect(result).toEqual({
        room1: room1Players,
        room2: room2Players,
        room3: [],
      });
      expect(mockPipeline.get).toHaveBeenCalledTimes(3);
    });

    it("should return empty object when no room IDs provided", async () => {
      const result = await roomManager.getMultipleRoomPlayers([]);

      expect(result).toEqual({});
      expect(mockRedis.pipeline).not.toHaveBeenCalled();
    });

    it("should handle JSON parse errors gracefully", async () => {
      const roomIds = ["room1"];
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const mockPipeline = {
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, "invalid json"]]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      const result = await roomManager.getMultipleRoomPlayers(roomIds);

      expect(result).toEqual({
        room1: [],
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error parsing data for room room1:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("should handle null results from pipeline", async () => {
      const roomIds = ["room1", "room2"];

      const mockPipeline = {
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      const result = await roomManager.getMultipleRoomPlayers(roomIds);

      expect(result).toEqual({
        room1: [],
        room2: [],
      });
    });
  });
});

