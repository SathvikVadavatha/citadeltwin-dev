-- Seed req_federal_rules: nationwide ADA/OSHA requirements.
-- Every value below was checked against a live fetch of ada.gov / osha.gov on 2026-08-09.
-- The residential row (display_order 16) is explanatory, not a numeric requirement —
-- comparator = 'note' is a sentinel the frontend uses to render it as prose, not a table row.

insert into req_federal_rules
  (category, applies_to, requirement, value, unit, comparator, note, citation, source_title, source_url, verified_at, display_order)
values
  ('accessibility', 'commercial', 'Accessible route clear width', '36', 'in', 'min',
   'Reduced-width segments (32 in for runs of 24 in or less) and 180-degree turn allowances have separate exceptions under 403.5.2/403.5.3.',
   'ADA 403.5.1', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#403-walking-surfaces', '2026-08-09', 1),

  ('accessibility', 'commercial', 'Door maneuvering clearance, latch side', '18', 'in', 'min',
   'Value is for a front approach beyond the latch side; other approach and door configurations have different values per Table 404.2.4.1.',
   'ADA 404.2.4', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-doors-doorways-and-gates', '2026-08-09', 2),

  ('accessibility', 'commercial', 'Doorway clear width', '32', 'in', 'min',
   'Measured with the door open 90 degrees, face of door to stop; openings deeper than 24 in require 36 in minimum.',
   'ADA 404.2.3', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-doors-doorways-and-gates', '2026-08-09', 3),

  ('accessibility', 'commercial', 'Ramp running slope', '1:12', 'ratio', 'max',
   'Steepest slope allowed for new construction; existing-facility ramps may use steeper slopes per Table 405.2 where space is constrained.',
   'ADA 405.2', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#405-ramps', '2026-08-09', 4),

  ('accessibility', 'commercial', 'Ramp maximum rise (per run)', '30', 'in', 'max',
   'Rise above this requires a landing and a new ramp run.',
   'ADA 405.6', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#405-ramps', '2026-08-09', 5),

  ('accessibility', 'commercial', 'Handrail gripping-surface height, minimum', '34', 'in', 'min',
   'Applies to handrails on stairs and ramps, measured above the walking surface or nosing. Height must stay within the 34-38 in range along the full run.',
   'ADA 505.4', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#505-handrails', '2026-08-09', 6),

  ('accessibility', 'commercial', 'Handrail gripping-surface height, maximum', '38', 'in', 'max',
   'Same section as the minimum height; height must be consistent along the run.',
   'ADA 505.4', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#505-handrails', '2026-08-09', 7),

  ('accessibility', 'commercial', 'Wheelchair accessible toilet compartment width', '60', 'in', 'min',
   'Measured perpendicular to the side wall; depth requirement (56-59 in depending on fixture mount) is separate.',
   'ADA 604.8.1.1', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#604-water-closets-and-toilet-compartments', '2026-08-09', 8),

  ('accessibility', 'commercial', 'Forward reach, maximum height', '48', 'in', 'max',
   'Applies to unobstructed forward reach; low forward reach minimum is 15 in.',
   'ADA 308.2.1', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#308-reach-ranges', '2026-08-09', 9),

  ('accessibility', 'commercial', 'Side reach, maximum height', '48', 'in', 'max',
   'Applies to unobstructed side reach with an obstruction depth of 10 in or less; obstructed reach up to 24 in depth lowers the max to 46 in.',
   'ADA 308.3.1', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#308-reach-ranges', '2026-08-09', 10),

  ('accessibility', 'commercial', 'Accessible parking space width (car)', '96', 'in', 'min',
   'This value is for car spaces. Van spaces must be 132 in wide minimum, or 96 in wide minimum if paired with a 96 in wide access aisle.',
   'ADA 502.2', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#502-parking-spaces', '2026-08-09', 11),

  ('accessibility', 'commercial', 'Van accessible parking access aisle width', '96', 'in', 'min',
   'Car-space access aisles are only 60 in minimum; van-space aisles must be 96 in minimum.',
   'ADA 502.3.1', '2010 ADA Standards for Accessible Design (28 CFR Part 36)',
   'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#502-parking-spaces', '2026-08-09', 12),

  ('safety', 'commercial', 'Exit route minimum width', '28', 'in', 'min',
   'An exit access must be at least 28 inches wide at all points.',
   '29 CFR 1910.36(g)(2)', 'OSHA 29 CFR 1910 Subpart E - Means of Egress',
   'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.36', '2026-08-09', 13),

  ('safety', 'commercial', 'Exit route minimum ceiling height', '90', 'in', 'min',
   'Equivalent to 7 ft 6 in. The ceiling of an exit route must be at least seven feet six inches high.',
   '29 CFR 1910.36(g)(1)', 'OSHA 29 CFR 1910 Subpart E - Means of Egress',
   'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.36', '2026-08-09', 14),

  ('safety', 'commercial', 'Guardrail (top rail) height', '42', 'in', 'required',
   'OSHA specifies 42 inches, plus or minus 3 inches, above the walking-working surface - an allowable installed range of 39-45 in around the 42 in nominal value.',
   '29 CFR 1910.29(b)(1)', 'OSHA 29 CFR 1910 Subpart D - Walking-Working Surfaces',
   'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.29', '2026-08-09', 15),

  ('accessibility', 'residential', 'Federal accessibility applicability to residential property', 'N/A', null, 'note',
   'Federal accessibility standards apply to public accommodations and commercial facilities. They generally do not apply to private single-family homes. The Fair Housing Act imposes accessibility requirements on multi-family housing of four or more units built for first occupancy after March 13, 1991 (accessible entrance and route, usable doors, accessible common areas, adaptable kitchens and bathrooms in covered units). This is reference information only, not a compliance determination.',
   'ADA Title III Technical Assistance Manual Section III-1.2000; Fair Housing Act 42 U.S.C. 3604(f)(3)(C); 24 CFR 100.201, 100.205',
   'ADA.gov - Guide to Disability Rights Laws',
   'https://www.ada.gov/resources/disability-rights-guide/', '2026-08-09', 16);
