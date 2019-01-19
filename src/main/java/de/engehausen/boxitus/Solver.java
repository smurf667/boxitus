package de.engehausen.boxitus;

import java.awt.Point;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import de.engehausen.boxitus.Level.TileType;
import de.engehausen.boxitus.Solver.Move.Direction;

/**
 * A solver for Boxitus levels. This is not a perfect solver, as it cannot find a solution
 * for actions that are time-dependent (e.g. see "gqxf" and "ha88").
 * It also uses heavy recursion and may go out of memory on technically solvable levels.
 */
public class Solver {
	
	private final Level root;

	/**
	 * Creates the solver for the given level.
	 * @param level the level to solve, must not be {@code null}.
	 */
	public Solver(final Level level) {
		if (level.playerPosition == null) {
			throw new IllegalStateException("player starting position required");
		}
		if (level.exitPosition == null) {
			throw new IllegalStateException("exit portal position required");
		}
		root = level;
	}

	/**
	 * Attemps to solve the given level.
	 * @param control a control predicate which can be used to abort the computation,
	 * must not be {@code null}
	 * @return a list of possible solutions, starting with the shortest one found.
	 * Note this does <em>not</em> return <em>all</em> possible solutions.
	 */
	public List<List<Move>> solve(final Predicate<Void> control) {
		final List<List<Move>> solutions = new ArrayList<>();
		final Deque<Move> queue = new ArrayDeque<>();
		solve(control, queue, new StatefulLevel(root, true), root.playerPosition, null, new HashMap<>(), solutions);
		solutions.sort((a, b) -> a.size() - b.size());
		return solutions;
	}

	protected void solve(final Predicate<Void> control, final Deque<Move> queue, final StatefulLevel level, final Point position, final Move.Direction from, final Map<VisitInfo, Deque<Direction>> visited, final List<List<Move>> solutions) {
		if (!control.test(null) ||
			position.x < 0 || position.x >= Level.WIDTH ||
			position.y < 0 || position.y >= Level.HEIGHT) {
			return;
		}
		final TileType levelTile = level.at(position.x, position.y);
		if (TileType.Portal.equals(levelTile) || TileType.PortalBombless.equals(levelTile)) {
			addSolution(levelTile, level, queue, solutions);
			return;
		}
		final VisitInfo info = new VisitInfo(position, from, level);
		final Deque<Direction> candidates = visited.computeIfAbsent(info, any -> new ArrayDeque<>(Move.Direction.asList()));
		final List<Direction> restore = new ArrayList<>(candidates);
		while (!candidates.isEmpty()) {
			final Direction nextDirection = candidates.removeLast();
			queue.addLast(new Move(nextDirection, position, level));
			final Point nextPosition = new Point(position);
			final StatefulLevel next = level.move(nextPosition, nextDirection);
			if (next != null) {
				solve(control, queue, next, nextPosition, nextDirection, visited, solutions);
			}
			queue.removeLast();
		}
		candidates.addAll(restore);
		return;
	}

	private void addSolution(final TileType tile, final StatefulLevel level, final Deque<Move> queue, final List<List<Move>> solutions) {
		if (level.hasSensors()) {
			return;
		}
		if (TileType.PortalBombless.equals(tile) && level.hasBombs()) {
			// not a valid solution, all bombs must have been cleared
			return;
		}
		if (solutions.isEmpty()) {
			solutions.add(new ArrayList<>(queue));
		} else if (solutions.get(solutions.size() - 1).size() > queue.size()) {
			// only record shorter solutions
			solutions.add(new ArrayList<>(queue));
		}
	}

	/**
	 * An element representing a move action for a level.
	 */
	public static class Move {

		/**
		 * Represents a direction.
		 */
		public enum Direction {
			Left(-1, 0, 180),
			Right(1, 0, 0),
			Down(0, 1, 90),
			Up(0, -1, 270);

			private static List<Direction> LIST = Collections.unmodifiableList(Arrays.asList(Direction.values()));

			@JsonIgnore
			private final Point dir;
			@JsonIgnore
			private final int angle;

			Direction(final int dx, final int dy, final int a) {
				dir = new Point(dx, dy);
				angle = a;
			}

			/**
			 * Returns the direction as a point.
			 * The coordinates will have values -1, 0 or 1
			 * @return the point, and never {@code null}. Warning, this is a mutable object,
			 * must not change the point values on it!
			 */
			public Point asPoint() {
				return dir;
			}

			/**
			 * Returns the direction as an angle (in degrees).
			 * @return the angle, a value of either 0, 90, 180 or 270.
			 */
			public int getAngle() {
				return angle;
			}

			/**
			 * Returns the directions as a list.
			 * @return the directions as a list, never {@code null}
			 */
			public static List<Direction> asList() {
				return LIST;
			}

			/**
			 * Returns a direction enumeration from the given point.
			 * @param vector the vector to turn into a direction (the coordinates must
			 * only have values -1, 0 or 1).
			 * @return the direction or {@code null}
			 */
			public static Direction from(final Point vector) {
				// returns the direction, but only for the for "normal" vectors known...
				for (Direction candidate : Direction.values()) {
					if (candidate.dir.equals(vector)) {
						return candidate;
					}
				}
				return null;
			}
		}
		
		private final Direction direction;
		private final Level level;
		private final int x;
		private final int y;

		/**
		 * Creates the move action.
		 * @param direction the direction of the move, must not be {@code null}
		 * @param current the current position, must not be {@code null}
		 * @param level the level the move operates on, must not be {@code null}
		 */
		public Move(final Direction direction, final Point current, final Level level) {
			this.direction = direction;
			this.x = current.x;
			this.y = current.y;
			this.level = level;
		}

		/**
		 * Returns the direction of the move.
		 * @return the direction of the move.
		 */
		public Direction direction() {
			return direction;
		}

		/**
		 * Returns the position of the move.
		 * @return the position of the move. This is a new object and may
		 * be manipulated later on.
		 */
		public Point getPosition() {
			if (x >= 0) {
				return new Point(x * 32, y * 32);
			}
			return null;
		}

		/**
		 * Returns the level of the move.
		 * @return the level of the move.
		 */
		public Level getLevel() {
			return level;
		}

		/**
		 * {@inheritDoc}
		 */
		@Override
		public String toString() {
			return direction.toString();
		}

	}

	private static class VisitInfo {

		private final int x;
		private final int y;
		private final Move.Direction direction;
		private final Integer levelID;
		private final int hc;

		public VisitInfo(final Point p, final Move.Direction dir, final Level l) {
			x = p.x;
			y = p.y;
			direction = dir;
			levelID = l.getUniqueIdentifier();
			final int prime = 53;
			int result = 1;
			result = prime * result + levelID.hashCode();
			result = prime * result + x;
			result = prime * result + y;
			if (dir != null) {
				result += dir.hashCode();
			}
			hc = result;
		}

		@Override
		public int hashCode() {
			return hc;
		}

		@Override
		public boolean equals(final Object obj) {
			if (this == obj) {
				return true;
			}
			if (obj == null || getClass() != obj.getClass()) {
				return false;
			}
			final VisitInfo other = (VisitInfo) obj;
			// identity comparison on level unique ID...
			return levelID == other.levelID && x == other.x && y == other.y && direction == other.direction;
		}

	}
}
