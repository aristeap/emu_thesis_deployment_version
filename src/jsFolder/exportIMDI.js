function downloadIMDIFile() {
    console.log("inside downloadIMDIFile()");

    // Retrieve saved metadata from localStorage
    const savedMetadata = localStorage.getItem('savedMetadata');
    if (!savedMetadata) {
      alert("No metadata found. Save your data first!");
      return;
    }
  
    
    const metadata = JSON.parse(savedMetadata);
    console.log("metadata : ",metadata);
  
    // Extract data from the consolidated metadata object
    const { recording, content, actors = [], languages = [] } = metadata;

    console.log("recording: ",)
  
    // Generate IMDI XML
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<METATRANSCRIPT xmlns="http://www.mpi.nl/IMDI/Schema/IMDI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Date="' + new Date().toISOString().split('T')[0] + '" FormatId="IMDI 3.03" Originator="EMU-SDMS" Type="SESSION" Version="0" xsi:schemaLocation="http://www.mpi.nl/IMDI/Schema/IMDI ./IMDI_3.0.xsd">',
      '  <Session>',
      `    <Name>${recording?.filename || 'Unspecified'}</Name>`,
      `    <Title>${recording?.title || 'Unspecified'}</Title>`,
      `    <Date>${recording?.date || 'Unspecified'}</Date>`,
      `    <Description LanguageId="ISO639-3:eng">${recording?.description || 'No description'}</Description>`,
      '    <MDGroup>',
      '      <Location>',
      `        <Continent Type="ClosedVocabulary">${recording?.continent || 'Unspecified'}</Continent>`,
      `        <Country Type="OpenVocabulary">${recording?.country || 'Unspecified'}</Country>`,
      `        <Region>${recording?.region || 'Unspecified'}</Region>`,
      `        <Address>${recording?.address || 'Unspecified'}</Address>`,
      '      </Location>',
      '      <Content>',
      `        <Genre>${content?.genre || 'Unspecified'}</Genre>`,
      `        <Modalities>${content?.modalities || 'Unspecified'}</Modalities>`,
      '        <CommunicationContext>',
      `          <PlanningType>${content?.planning_type || 'Unspecified'}</PlanningType>`,
      '        </CommunicationContext>',
      '        <Languages>',
    ];
  
    // Add languages
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
      '      <Actors>'
    );
  
    // Add actors
    actors.forEach(actor => {
      xml.push(
        '        <Actor>',
        `          <Name>${actor?.first_name || 'Unspecified'}</Name>`,
        `          <FullName>${actor?.full_name || 'Unspecified'}</FullName>`,
        `          <Age>${actor?.age || 'Unspecified'}</Age>`,
        `          <Sex>${actor?.sex || 'Unspecified'}</Sex>`,
        `          <Education>${actor?.education || 'Unspecified'}</Education>`,
        `          <EthnicGroup>${actor?.ethnicity || 'Unspecified'}</EthnicGroup>`,
        '          <Contact>',
        `            <Email>${actor?.email || 'Unspecified'}</Email>`,
        '          </Contact>',
        '        </Actor>'
      );
    });
  
    // Close XML tags
    xml.push(
      '      </Actors>',
      '    </MDGroup>',
      '  </Session>',
      '</METATRANSCRIPT>'
    );
  
    // Create and trigger download
    const xmlString = xml.join('\n');
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${recording?.filename || 'metadata'}.imdi`;
    link.click();
  }