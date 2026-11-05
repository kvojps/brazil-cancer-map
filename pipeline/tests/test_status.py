import pytest

from pipeline.status import classify_status


@pytest.mark.parametrize(('value', 'expected'), [(100, 'reached'), (110, 'reached'), (80, 'near'), (79.99, 'far'), (None, None)])
def test_status_uses_fixed_reference_thresholds(value, expected):
    assert classify_status(value, reference=100) == expected


@pytest.mark.parametrize(('value', 'expected'), [(5.9, 'reached'), (5, 'reached'), (7.375, 'near'), (7.4, 'near'), (7.401, 'far')])
def test_smoking_reverses_the_reference_bands(value, expected):
    assert classify_status(value, reference=5.9, lower_is_better=True) == expected


def test_values_above_the_possible_keep_their_class_and_carry_a_note():
    from pipeline.status import status_note

    assert classify_status(123, reference=90) == 'reached'
    assert status_note(123, maximum=100) == 'valor acima do esperado, provavelmente erro no registro ou na estimativa de população'
    assert status_note(100, maximum=100) is None
