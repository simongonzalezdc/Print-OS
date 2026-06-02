# VoiceForge 3D Knowledge Base

This directory contains validated designs, component data, and AI training examples
for generating high-quality 3D printable designs.

## Directory Structure

```
/knowledge
├── README.md                    # This file
├── /components                  # Component dimension database
│   └── index.ts                 # Exports all component data
├── /templates                   # Validated JSCAD templates
│   ├── enclosure-basic.jscad    # Simple box enclosure
│   ├── phone-stand.jscad        # Universal phone stand
│   └── cable-organizer.jscad    # Desk cable clips
└── /examples                    # Few-shot examples for AI
    └── enclosure-prompts.json   # Prompt → code examples
```

## How to Use

### For Users
Browse the `/templates` directory for ready-to-use designs that have been
tested and validated on real 3D printers.

### For AI Training
The `/examples` directory contains prompt-to-code pairs that demonstrate
successful generations. These can be used for few-shot learning or fine-tuning.

### For Contributors
When you create and successfully print a design:
1. Add the validated JSCAD code to `/templates`
2. Include a prompt example in `/examples`
3. Document any DFM lessons learned

## Validation Criteria

A design is considered "validated" when:
- [ ] JSCAD code executes without errors
- [ ] Model is manifold (watertight)
- [ ] Slices successfully in standard slicer
- [ ] Prints successfully on at least one FDM printer
- [ ] Dimensions match specification within ±0.5mm
- [ ] Functional requirements are met

## Contributing

See the main project README for contribution guidelines.
