import React, { useState } from 'react';
import { Grid, TextField, Link } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
  Button,
  Progress,
} from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

import './PulumiGcpComponentStyles.css';

export const PulumiGcpComponent = () => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');

  const [stackName, setStackName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [url, setUrl] = useState<string>('')

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${backendUrl}/api/pulumi/aws/sites`, {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: stackName,
            content: `Greetings from ${stackName}, welcome to Tech at Scale!`
          }),
      });
      const data = await response.json();
      setUrl(data.url)
      setLoading(false)
      return data;
    } catch (error) {
      setLoading(false)
      console.log(error)

    }
  };

  return (
    <Page themeId="tool">
      <Header title="Welcome to pulumi!" subtitle="">
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <ContentHeader title="Pulumi Demo">
          <Button
            to=""
            color="primary"
            variant="contained"
            onClick={() => handleSubmit()}
          >
            Create
          </Button>
          <SupportButton>This is a Pulumi Demo</SupportButton>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            {loading ? <Progress /> : ''}
            <InfoCard className="inputContainer">
              <TextField
                className="input"
                label="Stack Name"
                onChange={e => setStackName(e.target.value)}
              ></TextField>
            </InfoCard>

            {url === '' || url === undefined ? "" : <InfoCard><Link href={`${url}`} target="_blank" rel="noreferrer">{url}</Link></InfoCard>}
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
