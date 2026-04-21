from gas_fair_calendar.seed_from_html import _parse_ev_array


def test_parse_ev_array_from_legacy_html():
    text = "const EV = [\n  {id:1, name:\"A\", shortName:\"A\", dates:\"1-2 Jan\", s:1, e:2, city:\"X\", country:\"Y\", flag:\"🏳\", region:\"eu\", type:\"lng\", tag:\"LNG\", org:\"Org\", venue:\"Venue\", scale:\"1\", desc:\"Desc\", contact:\"c\", url:\"https://example.com\", ticket:\"free\"}\n];"
    items = _parse_ev_array(text)
    assert len(items) == 1
    assert items[0]['name'] == 'A'
    assert items[0]['type'] == 'lng'
