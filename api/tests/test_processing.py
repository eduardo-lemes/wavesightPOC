"""Tests for processing functions."""
import numpy as np


def test_basic_stats():
    from api.main import _basic_stats
    y = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    stats = _basic_stats(y)
    assert stats["min"] == 1.0
    assert stats["max"] == 5.0
    assert abs(stats["mean"] - 3.0) < 0.01
    assert stats["std"] > 0


def test_find_peaks():
    from api.main import _find_peaks
    # Simple signal with clear peak at index 5
    y = np.array([0, 1, 2, 3, 4, 10, 4, 3, 2, 1, 0], dtype=float)
    peaks = _find_peaks(y)
    assert 5 in peaks


def test_find_peaks_with_height():
    from api.main import _find_peaks
    y = np.array([0, 1, 5, 1, 0, 1, 3, 1, 0], dtype=float)
    peaks = _find_peaks(y, min_height=4.0)
    assert 2 in peaks
    assert 6 not in peaks  # 3.0 < 4.0


def test_normalize_smoothing():
    from api.main import _normalize_smoothing
    assert _normalize_smoothing("none", None) == {"method": "none", "window": None}
    assert _normalize_smoothing("moving", 5)["method"] == "moving"
    assert _normalize_smoothing("savgol", 10)["window"] == 11  # Must be odd


def test_apply_smoothing_moving():
    from api.main import _apply_smoothing
    y = np.array([1.0, 10.0, 1.0, 10.0, 1.0])
    smoothed = _apply_smoothing(y, "moving", 3)
    assert len(smoothed) == len(y)
    assert smoothed[2] < 10.0  # Should be averaged


def test_analyze_patterns_empty():
    from api.main import _analyze_patterns
    result = _analyze_patterns(np.array([1, 2]), np.array([1, 2]), [0])
    assert result == {}


def test_classify_emission():
    from api.main import _classify_emission
    freq_short = np.linspace(0, 100, 200)
    freq_wide = np.linspace(0, 1000, 200)
    assert _classify_emission({"harmonics": {"count": 5}}, 10, freq_short) == "narrowband"
    assert _classify_emission({"harmonics": {"count": 5}}, 60, freq_wide) == "narrowband"  # harmonics dominate
    assert _classify_emission({}, 60, freq_short) == "broadband"  # high density, no harmonics
    assert _classify_emission({}, 5, freq_wide) == "indeterminate"


def test_compare_revisions():
    from api.main import _compare_revisions
    s1 = {"filename": "a.csv", "peaks": [{"frequency": 50.0, "intensity": 30.0}]}
    s2 = {"filename": "b.csv", "peaks": [{"frequency": 50.0, "intensity": 40.0}, {"frequency": 100.0, "intensity": 25.0}]}
    result = _compare_revisions([s1, s2])
    assert result is not None
    assert len(result["new_emissions"]) == 1  # 100 MHz is new
    assert len(result["significant_deltas"]) == 1  # 50 MHz changed by 10 dB


def test_compare_revisions_single():
    from api.main import _compare_revisions
    assert _compare_revisions([{"filename": "a.csv", "peaks": []}]) is None


def test_ai_provider_not_configured():
    from api.ai_provider import _is_configured
    # Default is none, so should not be configured
    assert not _is_configured()


def test_build_emc_prompt():
    from api.ai_provider import build_emc_prompt
    data = {
        "files": ["test.csv"],
        "stats": {"test.csv": {"min": 5.0, "max": 60.0, "mean": 25.0, "std": 10.0, "samples": 1000}},
        "peaks": [{"file": "test.csv", "freq_mhz": 50.0, "intensity_dbuv": 60.0}],
        "emission_type": "narrowband",
    }
    prompt = build_emc_prompt(data)
    assert "test.csv" in prompt
    assert "50.00" in prompt
    assert "narrowband" in prompt
