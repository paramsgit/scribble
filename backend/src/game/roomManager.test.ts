// src/game/RoomManager.test.ts
import RoomManager from "./roomManager";

const playerFactory = (id: string, name = "Test") => ({ id, name });

describe("RoomManager", () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = RoomManager.getInstance();
    (manager as any)["rooms"] = {};
    (manager as any)["playerRoomMap"] = {};
  });

  it("adds player to a room", () => {
    const player = playerFactory("1");
    manager.addPlayer(player, "room1");
    expect(manager.getRoomPlayers("room1")).toEqual([player]);
  });

  it("does not add player if room is full", () => {
    const roomId = "room-full";
    for (let i = 0; i < 6; i++) {
      manager.addPlayer(playerFactory(`${i}`), roomId);
    }
    expect(() => manager.addPlayer(playerFactory("7"), roomId)).toThrow(
      "Room is full"
    );
  });

  it("removes player from room", () => {
    const player = playerFactory("2");
    manager.addPlayer(player, "room2");
    const removedRoom = manager.removePlayer("2");
    expect(removedRoom).toBe("room2");
    expect(manager.getRoomPlayers("room2")).toEqual([]);
  });

  it("returns null if removing unknown player", () => {
    expect(manager.removePlayer("unknown")).toBeNull();
  });

  it("clears a room completely", () => {
    manager.addPlayer(playerFactory("3"), "room3");
    manager.addPlayer(playerFactory("4"), "room3");
    manager.clearRoom("room3");
    expect(manager.getRoomPlayers("room3")).toEqual([]);
    expect(manager.getRoomOfPlayer("3")).toBeNull();
  });
});
