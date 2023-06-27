import wikipedia from 'wikipedia'
import sentenceBoundaryDetection  from 'sbd'
import keyword_extractor  from 'keyword-extractor'

export class Wikipedia {

    constructor({ query, description = '', content = {}, sentences = [], lang = 'pt', keywords = [] }) {
        this.query = query
        this.description = description
        this.content = content
        this.sentences = sentences
        this.sentencesQuantity = 0
        this.lang = lang
        this.keywords = keywords
    }

    breakContentIntoSentences(content) {
        const sentences = sentenceBoundaryDetection.sentences(content ?? this.content.content)
        this.sentences = sentences
        this.sentencesQuantity = sentences.length
        return
    }

    extractKeywords(text) {
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
            remove_duplicates: true
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
            this.extractKeywords(sanitizedContent)
    
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

console.log(await new Wikipedia({ query: 'Karl Marx' }).search())