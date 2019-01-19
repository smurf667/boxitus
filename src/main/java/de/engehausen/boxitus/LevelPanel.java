package de.engehausen.boxitus;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.RenderingHints;
import java.awt.Stroke;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.geom.AffineTransform;
import java.util.HashMap;
import java.util.Map;

import javax.swing.JPanel;
import javax.swing.SwingUtilities;

import de.engehausen.boxitus.Level.TileType;
import de.engehausen.boxitus.Solver.Move;

/**
 * Panel rendering a level, offering also manipulations to the level.
 */
public class LevelPanel extends JPanel implements MouseMotionListener, MouseListener {

	private static final long serialVersionUID = 1L;
	private static final Dimension SIZE = new Dimension(20 * 32, 15 * 32);

	private final TileRenderers renderers;
	private final Editor editor;
	private final Stroke dashedStroke;
	private Level level;
	private Point tilePosition;

	/**
	 * Creates the panel.
	 * @param anEditor the editor the panel is for, must not be {@code null}
	 * @param tileRenderers the tile renderers to use, must not be {@code null}
	 */
	public LevelPanel(final Editor anEditor, final TileRenderers tileRenderers) {
		renderers = tileRenderers;
		editor = anEditor;
		dashedStroke = new BasicStroke(2, BasicStroke.CAP_BUTT, BasicStroke.JOIN_BEVEL, 0, new float[] { 3 }, 0);
		setPreferredSize(SIZE);
		addMouseListener(this);
		addMouseMotionListener(this);
		setFocusable(false);
	}

	/**
	 * Creates a "passive" level panel.
	 * @param parent the level panel to base on.
	 */
	public LevelPanel(final LevelPanel parent) {
		renderers = parent.renderers;
		editor = parent.editor;
		dashedStroke = parent.dashedStroke;
		setPreferredSize(SIZE);
		setFocusable(false);
	}

	/**
	 * Sets the level to work on.
	 * @param aLevel the level to work on, must not be {@code null}
	 */
	public void setLevel(final Level aLevel) {
		level = aLevel;
		SwingUtilities.invokeLater(() -> this.repaint());
	}

	/**
	 * Returns the current level
	 * @return the current level
	 */
	public Level getLevel() {
		return level;
	}

	/**
	 * Moves the whole level contents into the given direction.
	 * This is a lossy operation...
	 * 
	 * @param direction the direction to move into
	 */
	public void shift(final Move.Direction direction) {
		if (level == null) {
			return;
		}
		final Point delta = direction.asPoint();
		final TileType[][] data = new TileType[Level.HEIGHT][Level.WIDTH];
		for (int y = 0; y < Level.HEIGHT; y++) {
			data[y] = new TileType[Level.WIDTH];
			final int oy = y - delta.y;
			for (int x = 0; x < Level.WIDTH; x++) {
				final int ox = x - delta.x;
				if (ox >= 0 && ox < Level.WIDTH && oy >= 0 && oy < Level.HEIGHT) {
					data[y][x] = level.at(ox, oy);
				} else {
					data[y][x] = TileType.Empty;
				}
				
			}
		}
		for (int y = 0; y < Level.HEIGHT; y++) {
			for (int x = 0; x < Level.WIDTH; x++) {
				level.set(data[y][x], x, y);
			}
		}
		editor.setDirty(true);
		SwingUtilities.invokeLater(() -> this.repaint());
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void paint(final Graphics g) {
		final Graphics2D g2d = (Graphics2D) g;
		g2d.setBackground(Color.BLACK);
		g2d.fillRect(0, 0, getWidth(), getHeight());
		g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		final AffineTransform original = g2d.getTransform();
		if (level != null) {
			final Map<Point, TileType> deferred = new HashMap<>();
			for (int y = 0; y < Level.HEIGHT; y++) {
				final AffineTransform old = g2d.getTransform();
				for (int x = 0; x < Level.WIDTH; x++) {
					final TileType type = level.at(x, y);
					if (TileType.TrapLR.equals(type) || TileType.TrapTB.equals(type)) {
						deferred.put(new Point(x, y), type);
					} else {
						renderers
							.renderer(type)
							.accept(g2d);
					}
					g2d.translate(32, 0);
				}
				g2d.setTransform(old);
				g2d.translate(0, 32);
			}
			if (!deferred.isEmpty()) {
				deferred
					.entrySet()
					.stream()
					.forEach( entry -> {
						g2d.setTransform(original);
						g2d.translate(32 * entry.getKey().x, 32 * entry.getKey().y);
						renderers
							.renderer(entry.getValue())
							.accept(g2d);
					});
			}
		}
		g2d.setTransform(original);
		if (tilePosition != null) {
			g2d.setColor(Color.BLUE);
			g2d.setStroke(dashedStroke);
			g2d.drawRect(tilePosition.x * 32, tilePosition.y * 32, 31, 31);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void mouseReleased(final MouseEvent e) {
		if (tilePosition != null) {
			level.set(editor.getSelectedTile(), tilePosition.x, tilePosition.y);
			editor.setDirty(true);
			SwingUtilities.invokeLater(() -> this.repaint());
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void mouseMoved(final MouseEvent e) {
		final Point position = e.getPoint();
		final Point newTile = new Point(position.x / 32, position.y / 32);
		if (tilePosition == null || !tilePosition.equals(newTile)) {
			tilePosition = newTile;
			SwingUtilities.invokeLater(() -> this.repaint());
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void mouseEntered(final MouseEvent e) {
		// ignored
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void mouseExited(final MouseEvent e) {
		tilePosition = null;
		repaint();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void mouseDragged(final MouseEvent e) {
		// ignored
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void mouseClicked(final MouseEvent e) {
		// ignored
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void mousePressed(final MouseEvent e) {
		// ignored
	}

}
