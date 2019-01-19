package de.engehausen.boxitus;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dialog.ModalityType;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.RenderingHints;
import java.awt.Toolkit;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.StringSelection;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.InputEvent;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.awt.geom.AffineTransform;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.BoxLayout;
import javax.swing.DefaultListCellRenderer;
import javax.swing.ImageIcon;
import javax.swing.InputMap;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JList;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSeparator;
import javax.swing.JSlider;
import javax.swing.JTextField;
import javax.swing.KeyStroke;
import javax.swing.ListSelectionModel;
import javax.swing.SwingUtilities;
import javax.swing.filechooser.FileFilter;

import com.fasterxml.jackson.core.JsonProcessingException;

import de.engehausen.boxitus.Level.TileType;
import de.engehausen.boxitus.Solver.Move;
import de.engehausen.boxitus.Solver.Move.Direction;

/**
 * Editor for Boxitus levels.
 */
public class Editor extends JFrame implements ActionListener {

	private static final String TITLE = "Boxitus Level Editor";

	private static final long serialVersionUID = 1L;

	private final LevelPanel levelPanel;
	private final TilePanel tilePanel;
	private final JList<Level> levelList;
	private final Clipboard clipboard;
	
	private final JButton shiftLeft;
	private final JButton shiftRight;
	private final JButton shiftUp;
	private final JButton shiftDown;
	
	private JMenuItem fileNew;
	private JMenuItem fileOpen;
	private JMenuItem fileSave;
	private JMenuItem fileDataURL;
	private JMenuItem levelCopy;
	private JMenuItem levelPaste;
	private JMenuItem fileSolve;
	private JMenuItem fileExit;
	
	private File lastFolder;
	private String fileName;
	private boolean dirty;

	/**
	 * Creates the editor with the given title.
	 * @param title the title to use
	 */
	public Editor(final String title) {
		super(title);
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
		final JPanel root = new JPanel();
		root.setLayout(new BorderLayout());
		final TileRenderers tileRenderers = new TileRenderers();
		levelPanel = new LevelPanel(this, tileRenderers);
		levelPanel.setLevel(new Level());
		root.add(levelPanel, BorderLayout.CENTER);
		tilePanel = new TilePanel(tileRenderers);
		root.add(tilePanel, BorderLayout.SOUTH);
		getContentPane().add(root);
		setJMenuBar(createMenuBar());
		levelList = new JList<>(new Levels());
		levelList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
		levelList.setCellRenderer(new DefaultListCellRenderer() {
			private static final long serialVersionUID = 1L;
			@Override
			public Component getListCellRendererComponent(
				final JList<?> list,
				final Object value,
				final int index,
				final boolean isSelected,
				final boolean cellHasFocus) {
				final Levels levels = (Levels) list.getModel();
				return super.getListCellRendererComponent(list, levels.index.get(index), index, isSelected, cellHasFocus);
			}
		});
		removeDefaultCopyPaste(levelList);
		removeDefaultCopyPaste(levelPanel);
		levelList.addKeyListener(tilePanel);
		levelPanel.addKeyListener(tilePanel);
		addKeyListener(tilePanel);
		final Editor editor = this;
		levelList.addListSelectionListener( e -> {
			final int idx = e.getFirstIndex();
			if (idx >= 0 && e.getValueIsAdjusting() == false) {
				@SuppressWarnings("unchecked")
				final JList<Level> model = (JList<Level>) e.getSource();
				editor.levelPanel.setLevel(model.getSelectedValue());
			}
		});
		levelList.addKeyListener(new KeyAdapter() {
			@Override
			public void keyPressed(final KeyEvent e) {
				final int idx = levelList.getSelectedIndex();
				final int kc = e.getKeyCode();
				if (e.isShiftDown()) {
					if (KeyEvent.VK_UP == kc) {
						if (idx > 0) {
							((Levels) levelList.getModel()).swap(idx - 1, idx);
							editor.setDirty(true);
						}
					} else if (KeyEvent.VK_DOWN == kc) {
						if (idx < levelList.getModel().getSize()) {
							((Levels) levelList.getModel()).swap(idx, idx + 1);
							editor.setDirty(true);
						}
					}
				} else if (KeyEvent.VK_DELETE == kc && idx >= 0) {
					((Levels) levelList.getModel()).removeLevel(idx);
					editor.setDirty(true);
				}
			}
		});
		final JScrollPane scroller = new JScrollPane(levelList, JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED, JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
		scroller.setPreferredSize(new Dimension(52, 128));
		root.add(scroller, BorderLayout.WEST);
		final JPanel buttons = new JPanel();
		buttons.setLayout(new BoxLayout(buttons, BoxLayout.Y_AXIS));
		shiftLeft = createButton(buttons, Move.Direction.Left);
		shiftRight = createButton(buttons, Move.Direction.Right);
		shiftUp = createButton(buttons, Move.Direction.Up);
		shiftDown = createButton(buttons, Move.Direction.Down);
		root.add(buttons, BorderLayout.EAST);
		pack();
		setResizable(false);
		lastFolder = Paths.get(".").toAbsolutePath().normalize().toFile();
		new NewAction(this).actionPerformed(null);
		setDirty(false);
		center(this);
		clipboard.addFlavorListener( e -> {
			levelPaste.setEnabled(checkClipboard() != null);
		});
	}

	/**
	 * Returns whether the editor contents have been changed and
	 * saving the changes would be recommendable.
	 * @return {@code true} if changes were made
	 */
	public boolean isDirty() {
		return dirty;
	}

	/**
	 * Sets the dirty flag.
	 * @param flag the new value
	 */
	public void setDirty(final boolean flag) {
		dirty = flag;
		levelList.requestFocus();
	}

	/**
	 * Returns the type of tile currently selected.
	 * @return the type of tile currently selected, never {@code null}.
	 */
	public TileType getSelectedTile() {
		return tilePanel.getSelectedTile();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void actionPerformed(final ActionEvent e) {
		final Object source = e.getSource();
		if (shiftLeft.equals(source)) {
			levelPanel.shift(Direction.Left);
		} else if (shiftRight.equals(source)) {
			levelPanel.shift(Direction.Right);
		} else if (shiftUp.equals(source)) {
			levelPanel.shift(Direction.Up);
		} else if (shiftDown.equals(source)) {
			levelPanel.shift(Direction.Down);
		}
	}

	private JButton createButton(final JPanel panel, final Direction direction) {
		final BufferedImage img = new BufferedImage(18, 24, BufferedImage.TYPE_INT_ARGB);
		final Graphics2D g2d = img.createGraphics();
		try {
			g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
			g2d.setColor(Color.BLACK);
			g2d.translate(9, 12);
			g2d.rotate(Math.toRadians(direction.getAngle()));
			final Path2D.Double path = new Path2D.Double();
			path.moveTo(-8, -10.5);
			path.lineTo(7.5, 0);
			path.lineTo(-8, 10.5);
			path.closePath();
			g2d.fill(path);
		} finally {
			g2d.dispose();
		}
		final JButton result = new JButton(new ImageIcon(img));
		result.addActionListener(this);
		panel.add(result);
		return result;
	}

	private JMenuBar createMenuBar() {
		final JMenuBar result = new JMenuBar();
		
		fileNew = createMenu("New...", 'n', KeyEvent.VK_N, InputEvent.CTRL_DOWN_MASK, new NewAction(this));
		fileOpen = createMenu("Open...", 'o', KeyEvent.VK_O, InputEvent.CTRL_DOWN_MASK, new OpenAction(this));
		fileSave = createMenu("Save...", 's', KeyEvent.VK_S, InputEvent.CTRL_DOWN_MASK, new SaveAction(this));
		fileDataURL = createMenu("Create data URL...", 'u', KeyEvent.VK_U, InputEvent.CTRL_DOWN_MASK, new DataURLAction(this));
		levelCopy = createMenu("Copy level", 'c', KeyEvent.VK_C, InputEvent.CTRL_DOWN_MASK, new CopyAction(this));
		levelPaste = createMenu("Paste level", 'v', KeyEvent.VK_V, InputEvent.CTRL_DOWN_MASK, new PasteAction(this));
		levelPaste.setEnabled(checkClipboard() != null);
		fileSolve = createMenu("Solve...", 'e', KeyEvent.VK_E, InputEvent.CTRL_DOWN_MASK, new SolveAction(this));
		fileExit = createMenu("Exit", 'x', KeyEvent.VK_Q, InputEvent.CTRL_DOWN_MASK, new ExitAction(this));
		
		final JMenu file = new JMenu("File");
		file.setMnemonic('f');
		file.add(fileNew);
		file.add(new JSeparator());
		file.add(fileOpen);
		file.add(fileSave);
		file.add(fileDataURL);
		file.add(new JSeparator());
		file.add(levelCopy);
		file.add(levelPaste);
		file.add(new JSeparator());
		file.add(fileSolve);
		file.add(new JSeparator());
		file.add(fileExit);
		
		result.add(file);

		return result;
	}

	private JMenuItem createMenu(final String text, final char mnemonic, final int virtualKey, final int modifiers, final Action action) {
		final JMenuItem result = new JMenuItem(action);
		result.setText(text);
		result.setMnemonic(mnemonic);
		result.setAccelerator(KeyStroke.getKeyStroke(virtualKey, modifiers));
		return result;
	}

	private Level checkClipboard() {
		if (clipboard.isDataFlavorAvailable(DataFlavor.stringFlavor)) {
			try {
				return new Level(
					Levels.getObjectMapper().readValue(
						(String) clipboard.getData(DataFlavor.stringFlavor),
						String[].class
					)
				);
			} catch (IOException|UnsupportedFlavorException e) {
				// silently ignore
			}
		}
		return null;
	}

	private void removeDefaultCopyPaste(final JComponent component) {
		final InputMap map = component.getInputMap();
		map.put(KeyStroke.getKeyStroke("ctrl C"), "bogus");
		map.put(KeyStroke.getKeyStroke("ctrl V"), "bogus");
	}

	public static void main(final String... args) {
		final Editor editor = new Editor(TITLE);
		SwingUtilities.invokeLater(() -> editor.setVisible(true));
	}

	private static void center(final Component component) {
		final Dimension screenDimension = Toolkit.getDefaultToolkit().getScreenSize();
		component.setLocation(screenDimension.width / 2 - component.getSize().width / 2, screenDimension.height / 2 - component.getSize().height / 2);
	}

	private abstract static class EditorAction extends AbstractAction {
		private static final long serialVersionUID = 1L;
		protected final Editor editor;
		protected EditorAction(final Editor instance) {
			editor = instance;
		}
	}

	private static class ExitAction extends EditorAction {

		private static final long serialVersionUID = 1L;

		protected ExitAction(final Editor instance) {
			super(instance);
		}

		@Override
		public void actionPerformed(final ActionEvent event) {
			if (editor.isDirty()) {
				if (JOptionPane.showConfirmDialog(editor, "Unsaved changes - really quit?", "Choose", JOptionPane.YES_NO_OPTION) == JOptionPane.NO_OPTION) {
					return;
				}
			}
			System.exit(0);
		}
		
	}

	private static class CopyAction extends EditorAction {

		private static final long serialVersionUID = 1L;

		protected CopyAction(final Editor instance) {
			super(instance);
		}

		@Override
		public void actionPerformed(final ActionEvent event) {
			final Level level = editor.levelPanel.getLevel();
			if (level != null) {
				try {
					editor.clipboard.setContents(
						new StringSelection(
							Levels.getObjectMapper().writeValueAsString(level.toStringArray())
						),
						null);
				} catch (JsonProcessingException e) {
					// silently ignore
				}
			}
		}
		
	}

	private static class PasteAction extends EditorAction implements Transferable {

		private static final long serialVersionUID = 1L;
		private static DataFlavor[] EMPTY = new DataFlavor[0];

		protected PasteAction(final Editor instance) {
			super(instance);
		}

		@Override
		public void actionPerformed(final ActionEvent event) {
			final Level level = editor.levelPanel.getLevel();
			if (level != null) {
				final Level source = editor.checkClipboard();
				if (source != null) {
					for (int y = 0; y < Level.HEIGHT; y++) {
						for (int x = 0; x < Level.WIDTH; x++) {
							level.set(source.at(x, y), x, y);
						}
					}
				}
				editor.clipboard.setContents(this, null);
				SwingUtilities.invokeLater(() -> editor.levelPanel.repaint());
			}
		}

		@Override
		public DataFlavor[] getTransferDataFlavors() {
			return EMPTY;
		}

		@Override
		public boolean isDataFlavorSupported(final DataFlavor flavor) {
			return false;
		}

		@Override
		public Object getTransferData(final DataFlavor flavor) throws UnsupportedFlavorException, IOException {
			throw new UnsupportedFlavorException(flavor);
		}

	}

	private static class OpenAction extends EditorAction {

		private static final long serialVersionUID = 1L;

		protected OpenAction(final Editor instance) {
			super(instance);
		}
		
		@Override
		public void actionPerformed(final ActionEvent event) {
			if (editor.isDirty() && JOptionPane.showConfirmDialog(editor, "Unsaved changes - really discard?", "Choose", JOptionPane.YES_NO_OPTION) == JOptionPane.NO_OPTION) {
				return;
			}
			final JFileChooser fc = new JFileChooser();
			fc.setCurrentDirectory(editor.lastFolder);
			fc.setFileFilter(new FileFilter() {
				@Override
				public boolean accept(final File file) {
					return file.isDirectory() || file.getName().endsWith(".json");
				}
				@Override
				public String getDescription() {
					return "level file (.json)";
				}});
			final int response = fc.showOpenDialog(editor);
			if (response == JFileChooser.APPROVE_OPTION) {
				final File file = fc.getSelectedFile();
				if (file.exists()) {
					try {
						editor.levelList.setModel(Levels.load(new FileInputStream(file)));
						editor.levelList.setSelectedIndex(0);
						editor.levelPanel.setLevel(editor.levelList.getSelectedValue());
						editor.setDirty(false);
						editor.lastFolder = fc.getCurrentDirectory();
						editor.fileName = file.getName();
						editor.setTitle(TITLE + " - " + editor.fileName);
					} catch (IOException e) {
						JOptionPane.showMessageDialog(editor, "An error occured");
					}
				} else {
					JOptionPane.showMessageDialog(editor, file.getAbsolutePath() + " does not exist");
				}
			}
		}
		
	}

	private static class SaveAction extends EditorAction {

		private static final long serialVersionUID = 1L;

		protected SaveAction(final Editor instance) {
			super(instance);
		}
		
		@Override
		public void actionPerformed(final ActionEvent event) {
			if (editor.isDirty()) {
				final JFileChooser fc = new JFileChooser();
				fc.setCurrentDirectory(editor.lastFolder);
				if (editor.fileName != null) {
					fc.setSelectedFile(new File(editor.fileName));
				}
				fc.setFileFilter(new FileFilter() {
					@Override
					public boolean accept(final File file) {
						return file.isDirectory() || file.getName().endsWith(".json");
					}
					@Override
					public String getDescription() {
						return "level file (.json)";
					}});
				final int response = fc.showSaveDialog(editor);
				if (response == JFileChooser.APPROVE_OPTION) {
					final File file = fc.getSelectedFile();
					if (file.exists()) {
						if (JOptionPane.showConfirmDialog(editor, "File exists - overwrite?", "Choose", JOptionPane.YES_NO_OPTION) == JOptionPane.NO_OPTION) {
							return;
						}
					}
					try {
						Levels.save((Levels) editor.levelList.getModel(), new FileOutputStream(file));
						editor.setDirty(false);
						editor.lastFolder = fc.getCurrentDirectory();
						editor.fileName = file.getName();
						editor.setTitle(TITLE + " - " + editor.fileName);
					} catch (IOException e) {
						JOptionPane.showMessageDialog(editor, "An error occured");
					}
				}
			}
		}
		
	}

	private static class NewAction extends EditorAction {

		private static final long serialVersionUID = 1L;

		protected NewAction(final Editor instance) {
			super(instance);
		}

		@Override
		public void actionPerformed(final ActionEvent event) {
			final Levels levels = (Levels) editor.levelList.getModel();
			levels.addLevel(new Level());
			editor.levelList.setSelectedIndex(levels.getSize() - 1);
			editor.setDirty(true);
		}
		
	}

	private static class DataURLAction extends EditorAction {

		private static final long serialVersionUID = 1L;

		protected DataURLAction(final Editor instance) {
			super(instance);
		}

		@Override
		public void actionPerformed(final ActionEvent event) {
			final Levels levels = (Levels) editor.levelList.getModel();
			JOptionPane.showConfirmDialog(editor, new JTextField(levels.asDataURL(), 60), "Data URL", JOptionPane.DEFAULT_OPTION, JOptionPane.INFORMATION_MESSAGE, null);
		}
		
	}

	private static class SolveAction extends EditorAction {

		private static final long serialVersionUID = 1L;
		private final JButton run;
		private final JButton cancel;
		private final JButton close;
		private final MovePanel movePanel;
		private final JSlider slider;
		private final JTextField instructions;
		private final JButton plus;
		private final JButton minus;
		private volatile boolean running;
		private JDialog dialog;
		private List<List<Move>> moves;
		private int selection;
				
		protected SolveAction(final Editor instance) {
			super(instance);
			moves = Collections.emptyList();
			selection = -1;
			run = new JButton("solve");
			run.addActionListener(this);
			cancel = new JButton("cancel");
			cancel.setEnabled(false);
			cancel.addActionListener(this);
			close = new JButton("close");
			close.addActionListener(this);
			movePanel = new MovePanel(instance.levelPanel);
			slider = new JSlider(JSlider.HORIZONTAL);
			slider.setEnabled(false);
			slider.addChangeListener( evt -> {
				movePanel.setSelection(slider.getValue());
			});
			instructions = new JTextField(48);
			instructions.setEditable(false);
			plus = new JButton("+");
			plus.addActionListener(this);
			minus = new JButton("-");
			minus.addActionListener(this);
			setInstructions(-1);
		}

		@Override
		public void actionPerformed(final ActionEvent e) {
			final Object source = e.getSource();
			if (run.equals(source)) {
				final Level level = editor.levelPanel.getLevel();
				if (level != null) {
					run.setEnabled(false);
					if (level.playerPosition != null && level.exitPosition != null) {
						running = true;
						cancel.setEnabled(true);
						movePanel.hasBombs = level.hasBombs();
						final Solver solver = new Solver(level);
						new Thread(() -> {
							setMoves(solver.solve(x -> {
								return running;
							}));
							cancel.setEnabled(false);
						}).start();
					}
				} else {
					run.setEnabled(false);
				}
			} else if (cancel.equals(source) || close.equals(source)) {
				running = false;
				e.setSource(null);
				actionPerformed(e); // use the close code below
			} else if (plus.equals(source)) {
				setInstructions(selection + 1);
			} else if (minus.equals(source)) {
				setInstructions(selection - 1);
			} else {
				if (dialog != null) {
					dialog.setVisible(false);
					instructions.setText("");
					cancel.setEnabled(false);
					plus.setEnabled(false);
					minus.setEnabled(false);
					slider.setValue(0);
					dialog = null;
					return;
				}
				final Level level = editor.levelPanel.getLevel();
				if (level != null) {
					run.setEnabled(level.playerPosition != null && level.exitPosition != null);
				}
				dialog = new JDialog(editor, "Level solver...", ModalityType.MODELESS);
				dialog.setDefaultCloseOperation(HIDE_ON_CLOSE);
				dialog.addWindowListener(new WindowAdapter() {
					@Override
					public void windowClosed(WindowEvent e) {
						try {
							dialog.dispose();
						} finally {
							dialog = null;
						}
					}
				});
				movePanel.setLevel(null);
				movePanel.setMoves(Collections.emptyList());
				slider.setEnabled(false);
				final JPanel root = new JPanel();
				root.setLayout(new BoxLayout(root, BoxLayout.Y_AXIS));
				final JPanel buttons = new JPanel();
				buttons.add(run);
				buttons.add(cancel);
				buttons.add(close);
				root.add(buttons);
				root.add(movePanel);
				root.add(slider);
				final JPanel textPanel = new JPanel();
				textPanel.add(instructions);
				textPanel.add(plus);
				textPanel.add(minus);
				root.add(textPanel);
				dialog.add(root);
				dialog.pack();
				center(dialog);
				dialog.setVisible(true);
			}
		}

		private void setMoves(final List<List<Move>> list) {
			moves = list;
			setInstructions(0);
		}

		private void setInstructions(final int idx) {
			final int max = moves.size();
			if (idx >= 0 && idx < max) {
				selection = idx;
				plus.setEnabled(idx < max - 1);
				minus.setEnabled(idx > 0);
				instructions.setText(moves.get(idx).toString());
				slider.setMinimum(0);
				slider.setValue(0);
				slider.setMaximum(moves.get(idx).size() - 1);
				slider.setEnabled(true);
				slider.requestFocus();
				movePanel.setMoves(moves.get(idx));
			} else {
				plus.setEnabled(false);
				minus.setEnabled(false);
				instructions.setText("");
				movePanel.setMoves(Collections.emptyList());
				selection = -1;
			}
		}

	}

	private static class MovePanel extends LevelPanel {

		private static final long serialVersionUID = 1L;

		private List<Move> moves;
		private int selection;
		private String info;
		private boolean hasBombs;
		
		public MovePanel(final LevelPanel parent) {
			super(parent);
			setMoves(Collections.emptyList());
		}

		public void setLevel(final Level aLevel) {
			if (aLevel == null) {
				info = "";
			}
			super.setLevel(aLevel);
		}

		public void setMoves(final List<Move> list) {
			moves = list;
			setSelection(0);
			if (selection < 0 && getLevel() == null) {
				info = hasBombs ? "no direct solutions found\ntime-dependent solutions may exist" : "no solutions found";
				repaint();
			} else {
				info = "";
			}
		}
		
		public void setSelection(final int index) {
			if (index < 0 || index >= moves.size()) {
				selection = -1;
			} else {
				selection = index;
				final Move move = moves.get(index);
				if (move != null) {
					setLevel(move.getLevel());
				}
			}
		}

		@Override
		public void paint(final Graphics g) {
			super.paint(g);
			if (selection >= 0) {
				final Move move = moves.get(selection);
				if (move != null) {
					final Graphics2D g2d = (Graphics2D) g;
					final Point p = move.getPosition();
					g2d.setColor(Color.WHITE);
					final AffineTransform transform = g2d.getTransform();
					g2d.translate(p.x + 15, p.y + 15);
					g2d.rotate(Math.toRadians(move.direction().getAngle()));
					final Path2D.Double path = new Path2D.Double();
					path.moveTo(-8, -3);
					path.lineTo(9, -3);
					path.lineTo(9, -6);
					path.lineTo(17, 0);
					path.lineTo(9, 6);
					path.lineTo(9, 3);
					path.lineTo(-8, 3);
					path.closePath();
					g2d.fill(path);
					g2d.setTransform(transform);
				}
			}
			g.setColor(Color.LIGHT_GRAY);
			final Font old = g.getFont();
			try {
				g.setFont(TileRenderers.BIG_FONT);
				int y = 24;
				for (final String line : info.split("\n")) {
					g.drawString(line, 24, y += g.getFontMetrics().getHeight());
				}
			} finally {
				g.setFont(old);
			}
		}

	}

}
