package de.engehausen.boxitus;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Stroke;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import javax.swing.JButton;
import javax.swing.JPanel;

import de.engehausen.boxitus.Level.TileType;

/**
 * A panel showing all tiles, and allowing selection of one of them.
 */
public class TilePanel extends JPanel implements ActionListener, KeyListener {

	private static final long serialVersionUID = 1L;
	
	private final List<TileButton> buttons;
	private int selection;

	/**
	 * Creates the tile panel.
	 * @param tileRenderers the tile renderers to use, must not be {@code null}
	 */
	public TilePanel(final TileRenderers tileRenderers) {
		buttons = new ArrayList<>();
		for (TileType type : Level.TileType.values()) {
			final TileButton tb = new TileButton(type, tileRenderers.renderer(type));
			tb.addActionListener(this);
			buttons.add(tb);
			add(tb);
		}
		buttons.get(selection).setSelected(true);
		addKeyListener(this);
		setFocusable(true);
		setFocusTraversalKeysEnabled(false);
	}

	/**
	 * Returns the currently selected tile.
	 * @return the currently selected tile, never {@code null}
	 */
	public TileType getSelectedTile() {
		return buttons.get(selection).getType();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void actionPerformed(final ActionEvent e) {
		if (selection >= 0) {
			buttons.get(selection).setSelected(false);
		}
		selection = buttons.indexOf(e.getSource());
		if (selection >= 0) {
			buttons.get(selection).setSelected(true);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void keyPressed(final KeyEvent event) {
		// ignored
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void keyReleased(final KeyEvent event) {
		switch (event.getKeyCode()) {
			case KeyEvent.VK_RIGHT:
				buttons.get(selection).setSelected(false);
				selection = (selection + 1) % buttons.size();
				buttons.get(selection).setSelected(true);
				break;
			case KeyEvent.VK_LEFT:
				buttons.get(selection).setSelected(false);
				selection--;
				if (selection < 0) {
					selection += buttons.size();
				}
				buttons.get(selection).setSelected(true);
				break;
			default:
				break;
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void keyTyped(final KeyEvent event) {
		// ignored
	}

	private static class TileButton extends JButton {

		private static final long serialVersionUID = 1L;

		private static Dimension SIZE = new Dimension(34, 34);
		private static Color SELECTION_COLOR = new Color(192, 180, 48);
		private static Stroke FAT = new BasicStroke(1.5f);

		private final Consumer<Graphics2D> renderer;
		private final TileType type;

		public TileButton(final TileType type, final Consumer<Graphics2D> renderer) {
			super();
			this.renderer = renderer;
			this.type = type;
			setPreferredSize(SIZE);
			setMinimumSize(SIZE);
			setBackground(Color.BLACK);
		}

		public TileType getType() {
			return type;
		}

		@Override
		public void setSelected(final boolean b) {
			super.setSelected(b);
			setBackground(b ? SELECTION_COLOR : Color.BLACK);
		}

		@Override
		public void paint(final Graphics g) {
			super.paint(g);
			final Graphics2D g2d = (Graphics2D) g;
			g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
			g2d.setStroke(FAT);
			g2d.translate(1, 1);
			renderer.accept(g2d);
		}
	}

}
