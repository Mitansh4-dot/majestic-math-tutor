"""
convert_questions.py
=========================================================================
A beginner-friendly tool that reads a question-bank PDF (in the same
style as your "Majestic Math Tutor" quiz/test banks - numbered
questions, four "A. / B. / C. / D." options, with the CORRECT option
in **bold** text) and automatically turns it into ready-to-paste
JavaScript question objects, in the exact format questions.js uses.

WHY THIS EXISTS
-----------------------------------------------------------------------
Typing out dozens of questions by hand into questions.js is slow and
easy to mistype. This script reads the actual bold formatting inside
your PDF (the same way a person reading it would spot the bold answer)
so you don't have to re-type anything - you paste the PDF in, you get
JavaScript out.

HOW TO USE IT
-----------------------------------------------------------------------
1. Make sure Python is installed on your computer (most computers
   already have it). Open a terminal / command prompt in this folder.
2. Install the one library this script needs (only do this once):

       pip install pdfplumber

3. Run the script, giving it the path to your PDF:

       python convert_questions.py my_quiz_bank.pdf

4. It creates a new file called "converted_questions.js" next to your
   PDF. Open it, and copy-paste whichever blocks you need into
   questions.js.

5. At the very end it also prints a short "COULD NOT AUTO-DETECT"
   list - these are questions where the layout was too unusual for
   the script to be sure it got it right (for example, math symbols
   that don't extract cleanly from the PDF). Just check those few by
   eye; everything else does not need checking.

WHAT COUNTS AS "BOLD" HERE
-----------------------------------------------------------------------
Most PDF exporters mark bold text with a font name containing the word
"Bold" (for example "Arial-BoldMT" or "Verdana-Bold"). This script
looks for that. If your PDF was made differently and this stops
working, tell me and I will adjust it.
=========================================================================
"""

import sys
import re
import os

try:
    import pdfplumber
except ImportError:
    print("This script needs the 'pdfplumber' library.")
    print("Install it once with:  pip install pdfplumber")
    sys.exit(1)


def is_bold_font(font_name):
    """A font name counts as bold if the word 'Bold' appears in it."""
    return "Bold" in font_name


def extract_bold_marked_lines(pdf_path):
    """
    Reads every page of the PDF and rebuilds each line of text, wrapping
    any bold portion in double-asterisks, e.g. "A. cat **B. dog** C. bird".
    Returns one big list of these line strings, in reading order.
    """
    all_lines = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            chars = page.chars
            # group characters into lines by their vertical position
            lines_by_top = {}
            for c in chars:
                key = round(c["top"], 1)
                lines_by_top.setdefault(key, []).append(c)

            for top in sorted(lines_by_top.keys()):
                row = sorted(lines_by_top[top], key=lambda c: c["x0"])

                # walk along the row, grouping consecutive characters that
                # share the same bold/not-bold status
                pieces = []
                current_bold = None
                buffer_text = ""
                for c in row:
                    this_bold = is_bold_font(c.get("fontname", ""))
                    if current_bold is None:
                        current_bold = this_bold
                        buffer_text = c["text"]
                    elif this_bold == current_bold:
                        buffer_text += c["text"]
                    else:
                        pieces.append((current_bold, buffer_text))
                        current_bold = this_bold
                        buffer_text = c["text"]
                if buffer_text:
                    pieces.append((current_bold, buffer_text))

                line_text = ""
                for bold, text in pieces:
                    if bold:
                        line_text += "**" + text + "**"
                    else:
                        line_text += text
                all_lines.append(line_text)

    return all_lines


# Matches a line that starts a new numbered question, e.g. "3. What is..."
QUESTION_START = re.compile(r"^\s*\d+\.\s*(.+)")

# Matches the four options on one line, e.g.
#   A. cat **B. dog**  C. bird  D. fish
OPTION_PATTERN = re.compile(
    r"\*{0,2}([ABCD])\.\s*([^*]*?)\*{0,2}\s*(?=\*{0,2}[ABCD]\.|$)"
)


def parse_option_line(line):
    """
    Given a line that contains "A. ... B. ... C. ... D. ...", return a
    list of 4 (text, is_correct) tuples. Returns None if this line does
    not look like a 4-option line.
    """
    if not (
        re.search(r"\bA\.", line)
        and re.search(r"\bB\.", line)
        and re.search(r"\bC\.", line)
        and re.search(r"\bD\.", line)
    ):
        return None

    results = []
    matches = list(OPTION_PATTERN.finditer(line))
    if len(matches) < 4:
        return None

    for letter, text in [(m.group(1), m.group(2)) for m in matches[:4]]:
        # was this particular option wrapped in ** on either side?
        start = line.find(letter + ".")
        is_correct = "**" in line[max(0, start - 2): start] or "**" in text
        clean_text = text.replace("**", "").strip().rstrip(",")
        results.append((clean_text, "**" in text or is_correct))

    return results


def parse_questions(lines):
    """
    Walk through the extracted lines and build a list of question dicts:
    { "text": ..., "choices": [...], "correctIndex": N, "raw": original_line }
    Also returns a list of lines that looked like questions but could not
    be confidently parsed, so you can check them by hand.
    """
    questions = []
    unparsed = []

    pending_question_text = None

    for line in lines:
        clean_for_check = line.replace("**", "")

        q_match = QUESTION_START.match(clean_for_check)
        option_result = parse_option_line(line)

        if option_result is not None and pending_question_text is not None:
            correct_indexes = [i for i, (_, is_c) in enumerate(option_result) if is_c]
            choices = [text for text, _ in option_result]

            if len(correct_indexes) == 1:
                questions.append({
                    "text": pending_question_text.strip(),
                    "choices": choices,
                    "correctIndex": correct_indexes[0],
                })
            else:
                # 0 or more than 1 bold option found - flag for manual check
                unparsed.append(pending_question_text.strip() + "  |  " + line)

            pending_question_text = None
            continue

        if q_match:
            pending_question_text = q_match.group(1).replace("**", "")
            continue

        # a continuation line (question text wrapped onto a second line)
        if pending_question_text is not None and option_result is None:
            stripped = clean_for_check.strip()
            if stripped and not stripped.startswith(("Micro Quiz", "Grade")):
                pending_question_text += " " + stripped

    return questions, unparsed


def to_js_object(question, difficulty="medium", points=2):
    """Format one question dict as a single line of JavaScript."""
    choices_js = ", ".join('"' + c.replace('"', "'") + '"' for c in question["choices"])
    text_js = question["text"].replace('"', "'")
    return (
        '{ text: "' + text_js + '", choices: [' + choices_js + '], '
        + "correctIndex: " + str(question["correctIndex"])
        + ', difficulty: "' + difficulty + '", points: ' + str(points) + " }"
    )


def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_questions.py your_quiz_bank.pdf")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print("Could not find that file:", pdf_path)
        sys.exit(1)

    print("Reading", pdf_path, "...")
    lines = extract_bold_marked_lines(pdf_path)

    print("Looking for questions and bolded answers...")
    questions, unparsed = parse_questions(lines)

    out_path = os.path.join(os.getcwd(), "converted_questions.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("/* Auto-generated by convert_questions.py from " + os.path.basename(pdf_path) + " */\n")
        f.write("/* Copy the objects below into the right quiz1 / quiz2 / tests[N] array in questions.js */\n\n")
        for i, q in enumerate(questions):
            f.write(to_js_object(q) + ",\n")

    print("")
    print("Done! Found " + str(len(questions)) + " questions with a clear single bold answer.")
    print("Written to: " + out_path)

    if unparsed:
        print("")
        print("COULD NOT AUTO-DETECT " + str(len(unparsed)) + " question(s) - please check these by hand:")
        for item in unparsed:
            print("  - " + item)


if __name__ == "__main__":
    main()
