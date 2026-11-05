"""Limit the font's tnum feature to the figures.

Inter's tnum also swaps hyphens and other punctuation for wide tabular forms, which
opens gaps in running text such as "Código-fonte". The site turns tnum on everywhere.
"""
import sys

from fontTools.ttLib import TTFont

font = TTFont(sys.argv[1])
gsub = font["GSUB"].table
cmap = font.getBestCmap()
figures = {cmap[code] for code in range(0x30, 0x3A)}
lookups = {
    index
    for record in gsub.FeatureList.FeatureRecord
    if record.FeatureTag == "tnum"
    for index in record.Feature.LookupListIndex
}
if not lookups:
    sys.exit("the font has no tnum feature")
for index in lookups:
    for subtable in gsub.LookupList.Lookup[index].SubTable:
        single = subtable.ExtSubTable if hasattr(subtable, "ExtSubTable") else subtable
        if not hasattr(single, "mapping"):
            sys.exit(f"tnum lookup {index} is not a single substitution")
        single.mapping = {glyph: alternate for glyph, alternate in single.mapping.items() if glyph in figures}
font.save(sys.argv[2])
