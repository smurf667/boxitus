package de.engehausen.boxitus;

import java.awt.Point;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

public class Level {

	private static AtomicInteger UNIQUE_COUNTER = new AtomicInteger();

	public static final int WIDTH = 20;
	public static final int HEIGHT = 15;

	enum TileType {
		Empty(' '),
		Wall('w'),
		Bomb('B'),
		Portal('p'),
		PortalBombless('P'),
		Player('x'),
		DeflectorTL('a'),
		DeflectorTR('b'),
		DeflectorBR('c'),
		DeflectorBL('d'),
		TrapLR('T'),
		TrapTB('t'),
		Wormhole('h'),
		Sensor('s');
		
		private final char c;
		private static final Map<Character, TileType> ALL = new HashMap<>();
		
		TileType(final char c) {
			this.c = c;
		}
		
		public char character() {
			return c;
		}
		
		public static TileType from(final char c) {
			final Character key = Character.valueOf(c);
			return ALL.computeIfAbsent(key, n -> {
				for (TileType candidate : TileType.values()) {
					if (candidate.character() == c) {
						return candidate;
					}
				}
				return TileType.Empty;
			});
		}
	}

	private final TileType[][] tiles;
	protected Point playerPosition;
	protected Point exitPosition;
	protected List<Point> wormholes;
	private final Integer id;

	public Level(final String[] rows) {
		this();
		for (int y = 0; y < HEIGHT; y++) {
			for (int x = 0; x < WIDTH; x++) {
				tiles[y][x] = TileType.from(rows[y].charAt(x));
				if (TileType.Player.equals(tiles[y][x])) {
					playerPosition = new Point(x, y);
				} else if (TileType.Portal.equals(tiles[y][x]) || TileType.PortalBombless.equals(tiles[y][x])) {
					exitPosition = new Point(x, y);
				} else if (TileType.Wormhole.equals(tiles[y][x])) {
					wormholes.add(new Point(x, y));
				}
			}
		}
	}

	public Level(final Level source) {
		this();
		for (int y = 0; y < HEIGHT; y++) {
			for (int x = 0; x < WIDTH; x++) {
				initTile(source.at(x, y), x, y);
			}
		}
	}

	public Level() {
		tiles = new TileType[HEIGHT][WIDTH];
		wormholes = new ArrayList<>(2);
		id = UNIQUE_COUNTER.incrementAndGet();
	}

	public Integer getUniqueIdentifier() {
		return id;
	}

	public TileType at(final int x, final int y) {
		final TileType result = tiles[y][x];
		return result != null ? result : TileType.Empty;
	}

	public void set(final TileType tile, final int x, final int y) {
		initTile(tile, x, y);
	}

	private void initTile(final TileType tile, final int x, final int y) {
		if (TileType.TrapLR.equals(tile) && (y == 0 || y == HEIGHT - 1)) {
			// space needed above/below tile!
			return;
		}
		if (TileType.TrapTB.equals(tile) && (x == 0 || x == WIDTH - 1)) {
			// space needed left/right of tile!
			return;
		}
		if (TileType.Player.equals(tile)) {
			if (playerPosition != null) {
				tiles[playerPosition.y][playerPosition.x] = TileType.Empty;
			}
			playerPosition = new Point(x, y);
		} else if (TileType.Portal.equals(tile) || TileType.PortalBombless.equals(tile)) {
			if (exitPosition != null) {
				tiles[exitPosition.y][exitPosition.x] = TileType.Empty;
			}
			exitPosition = new Point(x, y);
		} else if (TileType.Wormhole.equals(tile)) {
			final Point point = new Point(x, y);
			if (wormholes.size() == 2) {
				final Point old = wormholes.remove(1);
				tiles[old.y][old.x] = TileType.Empty;
			}
			if (!wormholes.contains(point)) {
				wormholes.add(point);
			}
		} else {
			final Point point = new Point(x, y);
			if (point.equals(playerPosition)) {
				playerPosition = null;
			} else if (point.equals(exitPosition)) {
				exitPosition = null;
			}
			if (TileType.Wormhole.equals(tiles[y][x])) {
				wormholes.remove(point);
			}
		}
		tiles[y][x] = tile;
	}

	public String[] toStringArray() {
		final String[] result = new String[HEIGHT];
		final StringBuilder sb = new StringBuilder(WIDTH);
		for (int y = 0; y < HEIGHT; y++) {
			sb.setLength(0);
			for (int x = 0; x < WIDTH; x++) {
				sb.append(at(x, y).character());
			}
			result[y] = sb.toString();
		}
		return result;
	}

	@Override
	public String toString() {
		final StringBuilder sb = new StringBuilder(HEIGHT * (WIDTH + 2));
		for (String line : toStringArray()) {
			sb.append(line).append(System.lineSeparator());
		}
		return sb.toString();
	}
	public static Level createDemo() {
		final Level l = new Level(new String[] {
			"123456789w1234567890",
			"w2345678901234567890",
			"123wwwa89x1234T67BBw",
			"12345678901234567BB0",
			"12345678901234567890",
			"123456789t1234567890",
			"123456789t12345678p0",
			"123456789t1234567890",
			"12345678901234567890",
			"123a5b7890123456789w",
			"12345678901234567890",
			"123d56c8901234567890",
			"1234567890123456789w",
			"123456789w1234567890",
			"w234567890123456789w"
		});
		return l;
	}

	public boolean hasBombs() {
		for (int y = 0; y < Level.HEIGHT; y++) {
			for (int x = 0; x < Level.WIDTH; x++) {
				if (TileType.Bomb.equals(at(x, y))) {
					return true;
				}
			}
		}
		return false;
	}

}
