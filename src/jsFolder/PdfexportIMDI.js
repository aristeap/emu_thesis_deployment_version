function downloadIMDIFileForPDF() {
    console.log("inside downloadIMDIFileForPDF()");
  
    // 1) Retrieve saved metadata from localStorage
    const savedMetadata = localStorage.getItem('savedMetadata');
    if (!savedMetadata) {
      alert("No metadata found. Save your data first!");
      return;
    }
  
    const metadata = JSON.parse(savedMetadata);
    console.log("metadata:", metadata);
  
    // 2) Extract data from the consolidated PDF metadata object
    //    Adjust property names as needed if you used different ones in your code
    const { corpus = {}, authors = [], languages = [] } = metadata;
  
    // 3) Generate IMDI XML
    //    Below is an example structure: adapt to match your desired IMDI format
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<METATRANSCRIPT xmlns="http://www.mpi.nl/IMDI/Schema/IMDI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Date="' + new Date().toISOString().split('T')[0] + '" FormatId="IMDI 3.03" Originator="EMU-SDMS" Type="SESSION" Version="0" xsi:schemaLocation="http://www.mpi.nl/IMDI/Schema/IMDI ./IMDI_3.0.xsd">',
      '  <Session>',
      // Use doc_title for <Name> and corpus_type for <Title>, for example
      `    <Name>${corpus?.doc_title || 'Unspecified'}</Name>`,
      `    <Title>${corpus?.corpus_type || 'Unspecified'}</Title>`,
      // If you want to treat pub_year as date:
      `    <Date>${corpus?.pub_year || 'Unspecified'}</Date>`,
      // Put corpus_purpose into <Description> or wherever you like
      `    <Description LanguageId="ISO639-3:eng">${corpus?.corpus_purpose || 'No description'}</Description>`,
      '    <MDGroup>',
      '      <Location>',
      // PDF corpora might not have location data, so we just put placeholders
      '        <Continent Type="ClosedVocabulary">Unspecified</Continent>',
      '        <Country Type="OpenVocabulary">Unspecified</Country>',
      '        <Region>Unspecified</Region>',
      '        <Address>Unspecified</Address>',
      '      </Location>',
      '      <Content>',
      // Put the corpus’s genre here
      `        <Genre>${corpus?.genre || 'Unspecified'}</Genre>`,
      // If you want to store word_count, do it as a custom element or under <Description> 
      `        <WordCount>${corpus?.word_count || 'Unspecified'}</WordCount>`,
      // We can keep these placeholders or remove them:
      '        <Modalities>Unspecified</Modalities>',
      '        <CommunicationContext>',
      '          <PlanningType>Unspecified</PlanningType>',
      '        </CommunicationContext>',
      '        <Languages>',
    ];
  
    // 4) Add <Language> entries
    languages.forEach(lang => {
      xml.push(
        '          <Language>',
        `            <Id>${lang?.lang_id || 'Unspecified'}</Id>`,
        `            <Name>${lang?.lang_name || 'Unspecified'}</Name>`,
        `            <Dominant>${lang?.dominant || 'Unspecified'}</Dominant>`,
        `            <SourceLanguage>${lang?.source_lang || 'Unspecified'}</SourceLanguage>`,
        `            <TargetLanguage>${lang?.target_lang || 'Unspecified'}</TargetLanguage>`,
        '          </Language>'
      );
    });
  
    xml.push(
      '        </Languages>',
      '      </Content>',
      '      <Authors>'
    );
  
    // 5) Add <Author> entries
    authors.forEach(author => {
      xml.push(
        '        <Author>',
        `          <Name>${author?.first_name || 'Unspecified'}</Name>`,
        `          <FullName>${author?.full_name || 'Unspecified'}</FullName>`,
        `          <Age>${author?.age || 'Unspecified'}</Age>`,
        `          <Sex>${author?.sex || 'Unspecified'}</Sex>`,
        `          <Education>${author?.education || 'Unspecified'}</Education>`,
        `          <EthnicGroup>${author?.ethnicity || 'Unspecified'}</EthnicGroup>`,
        '          <Contact>',
        `            <Email>${author?.email || 'Unspecified'}</Email>`,
        '          </Contact>',
        '        </Author>'
      );
    });
  
    // 6) Close XML tags
    xml.push(
      '      </Authors>',
      '    </MDGroup>',
      '  </Session>',
      '</METATRANSCRIPT>'
    );
  
    // 7) Create and trigger download
    const xmlString = xml.join('\n');
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
  
    // Use doc_title as the filename or fallback
    link.download = `${corpus?.doc_title || 'pdf_metadata'}.imdi`;
    link.click();
  }
  