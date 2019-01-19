package de.engehausen.boxitus;

import java.awt.image.BufferedImage;
import java.awt.image.WritableRaster;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import javax.imageio.ImageIO;
import javax.swing.ListModel;
import javax.swing.event.ListDataEvent;
import javax.swing.event.ListDataListener;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Helper and list model of all known levels.
 */
public class Levels implements ListModel<Level> {

	private static final ObjectMapper MAPPER = new ObjectMapper();

	private static final Random RANDOM = new Random(System.nanoTime());
	private static final int WIDTH = 4 + Level.WIDTH * Level.HEIGHT;
	private static final char[] ALPHABET = Stream.of(
			IntStream.range('0', '9'),
			IntStream.range('a', 'z'),
			IntStream.of('-')
		).flatMapToInt(x -> x)
		.mapToObj(i -> Character.toString((char) i))
		.collect(Collectors.joining()).toCharArray();

	/**
	 * Returns the object mapper used for reading and writing level
	 * information in JSON format.
	 * @return the object mapper, never {@code null}.
	 */
	public static ObjectMapper getObjectMapper() {
		return MAPPER;
	}

	/**
	 * Loads the levels from the given stream.
	 * @param stream the stream to read from, must not be {@code null}
	 * @return the levels read
	 * @throws IOException in case of error
	 */
	public static Levels load(final InputStream stream) throws IOException {
		return MAPPER.readValue(stream, Levels.class);
	}

	/**
	 * Saves the given levels to the output stream.
	 * @param levels the levels to store, must not be {@code null}
	 * @param stream the stream to write to, must not be {@code null}
	 * @throws IOException in case of error
	 */
	public static void save(final Levels levels, final OutputStream stream) throws IOException {
		levels
			.levels
			.entrySet()
			.stream()
			.forEach( entry -> {
				final int idx = levels.index.indexOf(entry.getKey());
				levels.data.set(idx, entry.getValue().toStringArray());
			});
		MAPPER.writeValue(stream, levels);
	}

	/** a list of level codes */
	public List<String> index;

	/** a list with raw level data */
	public List<String[]> data;

	@JsonIgnore
	private Map<String, Level> levels;
	private List<ListDataListener> listeners;

	/**
	 * Creates the levels model.
	 */
	public Levels() {
		index = new ArrayList<>();
		data = new ArrayList<>();
		levels = new HashMap<>();
		listeners = new ArrayList<>(2);
	}

	/**
	 * Returns all known levels as a PNG. This is used
	 * as a cheap compression method and is being read again
	 * in {@code src/Levels.ts}
	 * @return the data URI for the level information, never {@code null}
	 */
	public String asDataURL() {
		final int max = data.size();
		final BufferedImage buffer = new BufferedImage(WIDTH, max, BufferedImage.TYPE_3BYTE_BGR);
		final WritableRaster raster = buffer.getRaster();
		for (int y = 0; y < max; y++) {
			raster.setPixels(0, y, WIDTH, 1, asPixels(y));
		}
		try (final ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			ImageIO.write(buffer, "png", baos);
			return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	/**
	 * Adds the given level, creating a unique code for it.
	 * @param level the level to add, must not be {@code null}
	 */
	public void addLevel(final Level level) {
		String code;
		do {
			code = createCode();
		} while (index.indexOf(code) >= 0);
		index.add(code);
		data.add(level.toStringArray());
		levels.put(code, level);
		final ListDataEvent event = new ListDataEvent(this, ListDataEvent.INTERVAL_ADDED, index.size() - 1, index.size());
		listeners.stream().forEach( l -> l.intervalAdded(event) );
	}

	/**
	 * Sets the level for the given code.
	 * @param code the code to use, must be an already existing code
	 * @param level the level to set for this code
	 */
	public void setLevel(final String code, final Level level) {
		final int idx = index.indexOf(code);
		if (idx >= 0) {
			data.set(idx, level.toStringArray());
			levels.put(code, level);
			final ListDataEvent event = new ListDataEvent(this, ListDataEvent.CONTENTS_CHANGED, idx, idx);
			listeners.stream().forEach( l -> l.contentsChanged(event) );
		}
	}

	/**
	 * Removes the level with the given code.
	 * @param code the code of the level to remove
	 */
	public void removeLevel(final String code) {
		final int idx = index.indexOf(code);
		if (idx >= 0) {
			index.remove(idx);
			data.remove(idx);
			levels.remove(code);
			final ListDataEvent event = new ListDataEvent(this, ListDataEvent.INTERVAL_REMOVED, idx, idx);
			listeners.stream().forEach( l -> l.intervalRemoved(event) );
		}
	}

	/**
	 * Removes a level by index
	 * @param idx the index of the level to remove
	 */
	public void removeLevel(final int idx) {
		removeLevel(index.get(idx));
	}

	/**
	 * Returns the code for the given index.
	 * @param idx the index to use
	 * @return the code at the given index
	 */
	public String getCode(final int idx) {
		return index.get(idx);
	}

	/**
	 * Switches the levels for the two given positions.
	 * @param from the first position
	 * @param to the second position
	 */
	public void swap(final int from, final int to) {
		swap(index, from, to);
		swap(data, from, to);
		final ListDataEvent event = new ListDataEvent(this, ListDataEvent.CONTENTS_CHANGED, from, to);
		listeners.stream().forEach( l -> l.contentsChanged(event) );
	}

	/**
	 * {@inheritDoc}
	 */
	@JsonIgnore
	@Override
	public int getSize() {
		return index.size();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Level getElementAt(final int idx) {
		return levels.computeIfAbsent(index.get(idx), code -> new Level(data.get(idx)));
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void addListDataListener(final ListDataListener l) {
		listeners.add(l);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void removeListDataListener(final ListDataListener l) {
		listeners.remove(l);
	}

	private String createCode() {
		final char[] c = new char[4];
		for (int i = 0; i < c.length; i++) {
			c[i] = ALPHABET[RANDOM.nextInt(ALPHABET.length)];
		}
		return new String(c);
	}

	private <T> void swap(final List<T> list, final int from, final int to) {
		final T temp = list.get(to);
		list.set(to, list.get(from));
		list.set(from, temp);
	}

	private int[] asPixels(final int idx) {
		final int[] pixels = new int[3 * WIDTH];
		int i = asPixels(pixels, getCode(idx), 0);
		final Level level = getElementAt(idx);
		for (final String row : level.toStringArray()) {
			i = asPixels(pixels, row, i);
		}
		return pixels;
	}
	
	private int asPixels(final int pixels[], final String raw, final int offset) {
		final int size = raw.length();
		for (int i = 0; i < size; i++) {
			final int v = raw.charAt(i);
			pixels[offset + 3 * i] = v;
			pixels[1 + offset + 3 * i] = v;
			pixels[2 + offset + 3 * i] = v;
		}
		return offset + 3 * size;
	}

}
