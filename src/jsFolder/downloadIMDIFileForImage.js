function downloadIMDIFileForImage() {
    console.log("inside downloadIMDIFileForImage()");
  
    // Retrieve saved metadata from localStorage
    const savedMetadata = localStorage.getItem('savedMetadata');
    if (!savedMetadata) {
      alert("No metadata found. Save your data first!");
      return;
    }
  
    const metadata = JSON.parse(savedMetadata);
    console.log("metadata:", metadata);
  
    // Extract data from the image metadata
    const { image, basicInfo, techDetails } = metadata;
  
    // Generate IMDI XML using image-specific fields
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<METATRANSCRIPT xmlns="http://www.mpi.nl/IMDI/Schema/IMDI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '   Date="' + new Date().toISOString().split('T')[0] + '" FormatId="IMDI 3.03" Originator="EMU-SDMS" Type="SESSION" Version="0"',
      '   xsi:schemaLocation="http://www.mpi.nl/IMDI/Schema/IMDI ./IMDI_3.0.xsd">',
      '  <Session>',
      `    <Name>${image?.filename || 'Unspecified'}</Name>`,
      `    <Title>${basicInfo?.title || 'Unspecified'}</Title>`,
      `    <Date>${basicInfo?.capture_date || 'Unspecified'}</Date>`,
      `    <Description LanguageId="ISO639-3:eng">${basicInfo?.description || 'No description'}</Description>`,
      '    <MDGroup>',
      '      <Location>',
      // Here we use location from basic info; add more details if needed.
      `        <Address>${basicInfo?.location || 'Unspecified'}</Address>`,
      '      </Location>',
      '      <Content>',
      `        <Photographer>${basicInfo?.photographer || 'Unspecified'}</Photographer>`,
      '        <TechnicalDetails>',
      `          <FileFormat>${techDetails?.file_format || 'Unspecified'}</FileFormat>`,
      `          <Resolution>${techDetails?.resolution || 'Unspecified'}</Resolution>`,
      `          <CameraModel>${techDetails?.camera_model || 'Unspecified'}</CameraModel>`,
      `          <Exposure>${techDetails?.exposure || 'Unspecified'}</Exposure>`,
      '        </TechnicalDetails>',
      '      </Content>',
      '    </MDGroup>',
      '  </Session>',
      '</METATRANSCRIPT>'
    ];
  
    // Create the XML string and trigger the download
    const xmlString = xml.join('\n');
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${image?.filename || 'image_metadata'}.imdi`;
    link.click();
  }
  