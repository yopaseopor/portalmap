
from googletrans import Translator

def translate_file(input_file, output_file, dest_lang):
    translator = Translator()
    with open(input_file, 'r', encoding='utf-8') as f_in:
        with open(output_file, 'w', encoding='utf-8') as f_out:
            for line in f_in:
                if line.strip():
                    try:
                        translated_line = translator.translate(line, dest=dest_lang).text
                        f_out.write(translated_line + '\n')
                    except Exception as e:
                        print(f"Error translating line: {line.strip()} - {e}")
                        f_out.write(line)
                else:
                    f_out.write('\n')

if __name__ == "__main__":
    translate_file('transcript_an.txt', 'transcript_an_ar.txt', 'an')

