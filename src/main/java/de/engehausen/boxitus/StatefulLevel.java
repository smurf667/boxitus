package de.engehausen.boxitus;

import java.awt.Point;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import de.engehausen.boxitus.Solver.Move;
import de.engehausen.boxitus.Solver.Move.Direction;

/**
 * A variant of a level which supports modifications and
 * other state (e.g. sensors).
 */
public class StatefulLevel extends Level {
	
	private static final Set<TileType> OCCUPIABLE_AFTER_TRAP = new HashSet<>(
		Arrays.asList(
			TileType.DeflectorBL, // TODO this is not completely correct, as it depends on the trap and direction!
			TileType.DeflectorBR,
			TileType.DeflectorTL,
			TileType.DeflectorTL,
			TileType.Empty,
			TileType.Portal,
			TileType.PortalBombless,
			TileType.Wormhole
		)
	);

	private final Map<Point, TileType> delta;
	private final Map<Point, Set<Direction>> sensors;
	private final Map<Point, AtomicInteger> overlaps;
	private final Point key;

	/**
	 * Creates the level based on the given level.
	 * @param level the level to use as a basis
	 * @param process {@code true} to process traps and sensors
	 */
	public StatefulLevel(final Level level, final boolean process) {
		super(level);
		delta = new HashMap<>();
		if (level instanceof StatefulLevel) {
			final StatefulLevel parent = (StatefulLevel) level;
			sensors = new HashMap<>();
			// deep copy
			parent
				.sensors
				.entrySet()
				.forEach(e -> sensors.put(e.getKey(), new HashSet<>(e.getValue())));
			overlaps = new HashMap<>();
			// deep copy
			parent
				.overlaps
				.entrySet()
				.forEach(e -> overlaps.put(e.getKey(), new AtomicInteger(e.getValue().get())));
		} else {
			sensors = new HashMap<>();
			overlaps = new HashMap<>();
		}
		key = new Point();
		if (process) {
			for (int y = 0; y < HEIGHT; y++) {
				for (int x = 0; x < WIDTH; x++) {
					switch (level.at(x, y)) {
					case TrapLR:
						addTrap(x, y - 1);
						addTrap(x, y + 1);
						break;
					case TrapTB:
						addTrap(x - 1, y);
						addTrap(x + 1, y);
						break;
					case Sensor:
						initSensor(new Point(x, y));
					default:
						break;
					}
				}
			}
			set(TileType.Empty, playerPosition.x, playerPosition.y);
		}
	}

	/**
	 * Moves to the next resting position.
	 * @param position the current player position (this method changes the position values)
	 * @param direction the direction to move in
	 * @return the level state after the move, or {@code null} if the move ends the game.
	 * Returns a copy of the level if a modification occured to it.
	 */
	public StatefulLevel move(final Point position, final Move.Direction direction) {
		StatefulLevel next = this;
		final Point origin = new Point(position);
		Point vector = direction.asPoint();
		do {
			position.translate(vector.x, vector.y);
			if (position.x < 0 || position.x == WIDTH ||
				position.y < 0 || position.y == HEIGHT) {
				return null; // left the field
			}
			switch (at(position.x, position.y)) {
			case Wall:
				// can't go there, stop
				return stop(next, origin, position, vector);
			case Portal:
			case PortalBombless:
				// that's it!
				return next;
			case DeflectorTL:
				if (vector.x == 1 || vector.y == 1) {
					// can't go there, stop
					return stop(next, origin, position, vector);
				} else {
					if (vector.x == - 1) {
						vector = Move.Direction.Down.asPoint();
					} else if (vector.y == -1) {
						vector = Move.Direction.Right.asPoint();
					}
				}
				break;
			case DeflectorTR:
				if (vector.x == -1 || vector.y == 1) {
					// can't go there, stop
					return stop(next, origin, position, vector);
				} else {
					if (vector.x == 1) {
						vector = Move.Direction.Down.asPoint();
					} else if (vector.y == -1) {
						vector = Move.Direction.Left.asPoint();
					}
				}
				break;
			case DeflectorBR:
				if (vector.x == -1 || vector.y == -1) {
					// can't go there, stop
					return stop(next, origin, position, vector);
				} else {
					if (vector.x == 1) {
						vector = Move.Direction.Up.asPoint();
					} else if (vector.y == 1) {
						vector = Move.Direction.Left.asPoint();
					}
				}
				break;
			case DeflectorBL:
				if (vector.x == 1 || vector.y == -1) {
					// can't go there, stop
					return stop(next, origin, position, vector);
				} else {
					if (vector.x == -1) {
						vector = Move.Direction.Up.asPoint();
					} else if (vector.y == 1) {
						vector = Move.Direction.Right.asPoint();
					}
				}
				break;
			case Bomb:
				final StatefulLevel afterBomb = new StatefulLevel(this, false);
				// remove the bomb
				afterBomb.set(TileType.Empty, position.x, position.y); 
				position.translate(-vector.x, -vector.y);
				return afterBomb;
			case TrapLR:
				final StatefulLevel afterLRTrap = new StatefulLevel(this, false);
				while (TileType.TrapLR.equals(at(position.x, position.y))) {
					afterLRTrap.removeTrap(position.x, position.y - 1);
					afterLRTrap.set(TileType.Wall, position.x, position.y);
					afterLRTrap.removeTrap(position.x, position.y + 1);
					position.translate(vector.x, vector.y);
				}
				final TileType exitTileLR = at(position.x, position.y);
				if (OCCUPIABLE_AFTER_TRAP.contains(exitTileLR)) {
					// move back and let the continueTrap handle the element
					position.translate(-vector.x, -vector.y);
				} else {
					return null;
				}
				return continueTrap(afterLRTrap, position, vector);
			case TrapTB:
				final StatefulLevel afterTBTrap = new StatefulLevel(this, false);
				while (TileType.TrapTB.equals(at(position.x, position.y))) {
					afterTBTrap.removeTrap(position.x - 1, position.y);
					afterTBTrap.set(TileType.Wall, position.x, position.y);
					afterTBTrap.removeTrap(position.x + 1, position.y);
					position.translate(vector.x, vector.y);
				}
				final TileType exitTileTB = at(position.x, position.y);
				if (OCCUPIABLE_AFTER_TRAP.contains(exitTileTB)) {
					// move back and let the continueTrap handle the element
					position.translate(-vector.x, -vector.y);
				} else {
					return null;
				}
				return continueTrap(afterTBTrap, position, vector);
			case Wormhole:
				position.setLocation(
					wormholes.get(
						(1 + wormholes.indexOf(position)) % wormholes.size()
					)
				);
				next = this;
				break;
			case Sensor:
				// mark this direction as visited
				final Direction currentDirection = Direction.from(vector);
				if (!next.sensors.get(position).contains(currentDirection)) {
					return null;
				}
				final StatefulLevel afterSensor = new StatefulLevel(this, false);
				afterSensor.sensors.get(position).remove(currentDirection);
				// can't go there, stop
				position.translate(-vector.x, -vector.y);
				return afterSensor;
			default:
				break;
			}
		} while (!position.equals(origin));
		return null; // going in circles...
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public TileType at(final int x, final int y) {
		key.x = x;
		key.y = y;
		final TileType result = delta.get(key);
		return result == null ? super.at(x, y) : result;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void set(final TileType tile, final int x, final int y) {
		if (!tile.equals(at(x, y))) {
			delta.put(new Point(x, y), tile);
		}
	}

	/**
	 * Checks if the tile at the given coordinates is "normal"
	 * or "special" (meaning player or exit position).
	 * @param x the x part of the coordinate
	 * @param y the y part of the coordinate
	 * @return {@code false} if the given position is the player
	 * or exit position, {@code true} otherwise.
	 */
	public boolean normalTile(final int x, final int y) {
		key.x = x;
		key.y = y;
		return !(key.equals(playerPosition) || key.equals(exitPosition));
	}

	/**
	 * Checks if the level has bombs.
	 * @return {@code true} if the level has bombs
	 */
	public boolean hasBombs() {
		int count = 0;
		for (int y = 0; y < Level.HEIGHT; y++) {
			for (int x = 0; x < Level.WIDTH; x++) {
				if (TileType.Bomb.equals(at(x, y))) {
					count++;
				}
			}
		}
		return count > 0;
	}

	/**
	 * Checks if the level has sensors that still need activation.
	 * @return {@code true} if sensors need to be activated, {@code false} otherwise.
	 */
	public boolean hasSensors() {
		return sensors.values().stream().filter(s -> !s.isEmpty()).count() > 0;
	}

	protected void removeTrap(final int x, final int y) {
		key.x = x;
		key.y = y;
		final AtomicInteger counter = overlaps.get(key);
		if (counter == null || counter.decrementAndGet() <= 0) {
			set(TileType.Empty, x, y);
		}
	}
	
	protected void addTrap(final int x, final int y) {
		set(TileType.Wall, x, y);
		final Point point = new Point(x, y);
		overlaps.computeIfAbsent(point, p -> new AtomicInteger()).incrementAndGet();
	}

	private StatefulLevel continueTrap(final StatefulLevel afterTrap, final Point position, final Point vector) {
		final StatefulLevel more = afterTrap.move(position, Direction.from(vector));
		return more != null ? more : afterTrap;
	}

	private StatefulLevel stop(final StatefulLevel next, final Point origin, final Point position, final Point delta) {
		position.translate(-delta.x, -delta.y);
		return origin.equals(position) ? null : next;
	}
	
	private void initSensor(final Point position) {
		final Set<Direction> result = new HashSet<>(Direction.asList());
		if (position.x == 0 || !TileType.Empty.equals(at(position.x - 1, position.y))) {
			result.remove(Direction.Right);
		}
		if (position.x == Level.WIDTH - 1 || !TileType.Empty.equals(at(position.x + 1, position.y))) {
			result.remove(Direction.Left);
		}
		if (position.y == 0 || !TileType.Empty.equals(at(position.x, position.y - 1))) {
			result.remove(Direction.Down);
		}
		if (position.y == Level.HEIGHT - 1 || !TileType.Empty.equals(at(position.x, position.y + 1))) {
			result.remove(Direction.Up);
		}
		sensors.put(position, result);
	}

}