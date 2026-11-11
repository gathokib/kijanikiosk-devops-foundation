'use strict';

exports.handler = async (event) => {
  const records = event.Records || [];

  for (const record of records) {
    console.log('Receipt upload detected:', {
      bucket: record.s3.bucket.name,
      key: decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
    });
  }

  return {
    processed: records.length,
    status: 'success'
  };
};
