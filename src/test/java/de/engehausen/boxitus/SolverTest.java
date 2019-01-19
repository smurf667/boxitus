package de.engehausen.boxitus;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import com.fasterxml.jackson.core.type.TypeReference;

import de.engehausen.boxitus.Solver.Move;
import de.engehausen.boxitus.Solver.Move.Direction;

/**
 * A unit test to verify that the solver solves the known levels as expected.
 */
public class SolverTest {

	private static Map<String, List<Direction>> EXPECTED;

	@BeforeClass
	public static void init() throws IOException {
		EXPECTED = Levels
			.getObjectMapper()
			.readValue(
				SolverTest.class.getResourceAsStream("/solutions.json"), new TypeReference<Map<String, List<Direction>>>() {}
			);
	}

	@Test
	public void checkAllSolutions() throws IOException {
		final Map<String, List<Direction>> allSolutions = new TreeMap<>((a, b) -> a.compareTo(b) );
		allSolutions.putAll(EXPECTED);
		final Levels levels = Levels.load(SolverTest.class.getResourceAsStream("/levels.json"));
		for (int i = levels.getSize(); --i >= 0; ) {
			final Level level = levels.getElementAt(i);
			final String code = levels.getCode(i);
			final Solver solver = new Solver(level);
			final List<List<Direction>> actualSolutions = transform(solver.solve( ignore -> true ));
			final List<Direction> expected = EXPECTED.get(code);
			if (expected != null) {
				// expected solution size must be okay in ordered results
				if (!actualSolutions.isEmpty() && actualSolutions.get(0).size() > expected.size()) {
					Assert.fail(code + ": the solution found is longer than expected - got " + actualSolutions.get(0) + " but expected " + expected);
				}
				if (!expected.isEmpty()) {
					Assert.assertTrue(code + ": could not find solution = " + expected, actualSolutions.contains(expected));
				}
			} else {
				allSolutions.put(code, actualSolutions.isEmpty() ? Collections.emptyList() : actualSolutions.get(0));
			}
		}
		if (EXPECTED.size() != allSolutions.size()) {
			final File out = new File("target/solutions-new.json");
			Levels
				.getObjectMapper()
				.writerWithDefaultPrettyPrinter()
				.writeValue(out, allSolutions);
			Assert.fail("new solutions were recorded in " + out.getAbsolutePath() + ", please update solutions.json");
		}
	}

	private List<List<Direction>> transform(final List<List<Move>> list) {
		return list
			.stream()
			.map(moves -> moves
				.stream()
				.map(move -> move.direction())
				.collect(Collectors.toList())
			)
			.collect(Collectors.toList());
	}

}