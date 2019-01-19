package de.engehausen.boxitus;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.geom.Path2D;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

import de.engehausen.boxitus.Level.TileType;

/**
 * Renderers for all tile types.
 */
public class TileRenderers {

	/** a big font */
	public static final Font BIG_FONT = new Font(Font.SANS_SERIF, Font.BOLD, 24);

	private final Map<TileType, Consumer<Graphics2D>> tileRenderers;
	private static final Consumer<Graphics2D> EMPTY = g -> {
		g.setColor(Color.DARK_GRAY);
		g.drawLine(0, 0, 31, 31);
		g.drawLine(31, 0, 0, 31);
	};

	/**
	 * Creates the renderers.
	 * The tiles are rendered "symbolically" as the actual game works in the browser
	 * with SVG ;-)
	 */
	public TileRenderers() {
		tileRenderers = new HashMap<>();
		tileRenderers.put(TileType.Wall, g -> { g.setColor(Color.RED); g.drawRect(0, 0, 31, 31); });
		tileRenderers.put(TileType.Bomb, g -> { g.setColor(Color.YELLOW); g.drawRect(0, 0, 31, 31); g.drawString("5", 12, 20); });
		tileRenderers.put(TileType.Player, g -> { g.setColor(Color.CYAN); g.fillOval(0, 0, 31, 31); });
		tileRenderers.put(TileType.Portal, g -> {
			g.setColor(Color.PINK);
			g.drawRect(0, 0, 31, 31);
			final Path2D p2d = new Path2D.Double();
			p2d.moveTo(5, 15);
			p2d.lineTo(10, 10);
			p2d.lineTo(10, 14);
			p2d.lineTo(26, 14);
			p2d.lineTo(26, 16);
			p2d.lineTo(10, 16);
			p2d.lineTo(10, 20);
			p2d.closePath();
			g.fill(p2d);
		});
		final Color pink = new Color(200, 24, 200);
		tileRenderers.put(TileType.PortalBombless, g -> {
			g.setColor(Color.PINK);
			g.drawRect(0, 0, 31, 31);
			final Path2D p2d = new Path2D.Double();
			p2d.moveTo(5, 15);
			p2d.lineTo(10, 10);
			p2d.lineTo(10, 14);
			p2d.lineTo(26, 14);
			p2d.lineTo(26, 16);
			p2d.lineTo(10, 16);
			p2d.lineTo(10, 20);
			p2d.closePath();
			g.setColor(pink);
			g.fill(p2d);
			g.setColor(Color.YELLOW);
			final Font old = g.getFont();
			try {
				g.setFont(BIG_FONT);
				g.drawString("?", 9, 23);
			} finally {
				g.setFont(old);
			}
		});
		tileRenderers.put(TileType.TrapTB, g -> {
			g.setColor(Color.LIGHT_GRAY);
			g.drawLine(0, 15, 31, 15);
			g.setColor(Color.RED);
			g.drawRect(-15, 0, 15, 30);
			g.drawRect(31, 0, 15, 30);
		});
		tileRenderers.put(TileType.TrapLR, g -> {
			g.setColor(Color.LIGHT_GRAY);
			g.drawLine(15, 0, 15, 31);
			g.setColor(Color.RED);
			g.drawRect(0, -15, 30, 15);
			g.drawRect(0, 31, 30, 15);
		});
		tileRenderers.put(TileType.DeflectorTL, g -> {
			g.setColor(Color.GREEN);
			final Path2D p2d = new Path2D.Double();
			p2d.moveTo(0, 0);
			p2d.lineTo(31, 0);
			p2d.lineTo(0, 31);
			p2d.closePath();
			g.draw(p2d);
		});
		tileRenderers.put(TileType.DeflectorTR, g -> {
			g.setColor(Color.GREEN);
			final Path2D p2d = new Path2D.Double();
			p2d.moveTo(0, 0);
			p2d.lineTo(31, 31);
			p2d.lineTo(31, 0);
			p2d.closePath();
			g.draw(p2d);
		});
		tileRenderers.put(TileType.DeflectorBR, g -> {
			g.setColor(Color.GREEN);
			final Path2D p2d = new Path2D.Double();
			p2d.moveTo(31, 0);
			p2d.lineTo(31, 31);
			p2d.lineTo(0, 31);
			p2d.closePath();
			g.draw(p2d);
		});
		tileRenderers.put(TileType.DeflectorBL, g -> {
			g.setColor(Color.GREEN);
			final Path2D p2d = new Path2D.Double();
			p2d.moveTo(0, 0);
			p2d.lineTo(0, 31);
			p2d.lineTo(31, 31);
			p2d.closePath();
			g.draw(p2d);
		});
		tileRenderers.put(TileType.Wormhole, g -> {
			g.setColor(Color.LIGHT_GRAY);
			g.fillArc(0, 0, 31, 31, 0, 180);
			g.setColor(Color.GRAY);
			g.fillArc(0, 0, 31, 31, 0, -180);
			g.setColor(Color.LIGHT_GRAY);
			g.fillOval(0, 8, 16, 16);
			g.setColor(Color.GRAY);
			g.fillOval(16, 8, 16, 16);
		});
		tileRenderers.put(TileType.Sensor, g -> {
			g.setColor(Color.GREEN);
			Path2D p2d = new Path2D.Double();
			p2d.moveTo(0, 0);
			p2d.lineTo(31, 0);
			p2d.lineTo(0, 31);
			p2d.lineTo(31, 31);
			p2d.closePath();
			g.draw(p2d);
			p2d = new Path2D.Double();
			p2d.moveTo(0, 4);
			p2d.lineTo(0, 27);
			p2d.lineTo(12, 15);
			p2d.closePath();
			g.draw(p2d);
			p2d = new Path2D.Double();
			p2d.moveTo(31, 4);
			p2d.lineTo(31, 27);
			p2d.lineTo(20, 15);
			p2d.closePath();
			g.draw(p2d);
		});
	}

	/**
	 * Returns a renderer for the given tile type.
	 * @param type the tile type to get a renderer for.
	 * @return a renderer, never {@code null}.
	 */
	public Consumer<Graphics2D> renderer(final TileType type) {
		return tileRenderers.computeIfAbsent(type, k -> EMPTY);
	}

}
