import wikipedia from 'wikipedia'
import sentenceBoundaryDetection  from 'sbd'
import keyword_extractor  from 'keyword-extractor'

export class Wikipedia {

    constructor(query, sentencesQuantity = 10) {
        this.query = query
        this.description = ''
        this.content = {}
        this.sentencesQuantity = sentencesQuantity
        this.sentences = []
        this.lang = ''
        this.keywords = []
    }

    breakContentIntoSentences(content) {
        this.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content ?? this.content.content)
        
        for(let sentence = 0; sentence < this.sentencesQuantity; sentence++){
            this.sentences.push(sentences[sentence])
        }
        return
    }

    #extractKeywords(text) {
        const languages = {
            pt: 'portuguese',
            en: 'english',
            fr: 'french',
            es: 'spanish'
        }

        const language = languages[this.lang]

        const keywords = keyword_extractor.extract(text, {
            language: language,
            remove_digits: true,
            return_changed_case:true,
            remove_duplicates: false
        })

        this.keywords = keywords
        return
    }

    #removeBlankLinesAndMarkDown(text) {
    
        const allLines = text.split('\n')
    
        const withoutBlankLinesAndMarkDown = allLines.filter((line) => {
            if(line.trim().length === 0 || line.trim().startsWith('=')){
                return false
            }
            return true
        })
        return this.#removeDateInParenteses(withoutBlankLinesAndMarkDown.join(' '))
    }

    #removeDateInParenteses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }

    async search(lang = 'pt') {
        try {
            this.lang = lang
            await wikipedia.setLang(lang)

            const apiContent = await wikipedia.page(this.query, {
                autoSuggest: true,
            })
        
            const [intro, images, summary, content, references] = await Promise.all([
                apiContent.intro(),
                apiContent.images(),
                apiContent.summary(),
                apiContent.content(),
                apiContent.references()
            ])
            
            this.description = summary.description

            const sanitizedContent = this.#removeBlankLinesAndMarkDown(content)
            this.breakContentIntoSentences(sanitizedContent)
            this.#extractKeywords(sanitizedContent)
    
            this.content = {
                intro,
                images,
                summary: this.#removeBlankLinesAndMarkDown(summary.extract),
                content: sanitizedContent,
                references
            }
    
            return this
        } catch (err) {
            return {
                error: 'Objeto não encontrado'
            }
        }
    }
}

