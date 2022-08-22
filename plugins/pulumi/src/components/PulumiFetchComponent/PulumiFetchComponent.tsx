import React from 'react';
import { OpenInNew, EditRounded, Delete } from '@material-ui/icons';
import {
  TableColumn,
  Table,
  TableProps,
  Progress,
} from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';

type stack = {
  value: string[];
};
type DenseTableProps = {
  stacks: stack[];
};

const DefaultTable = ({ stacks }: DenseTableProps) => {
  const columns: TableColumn[] = [
    {
      title: 'Stack Name',
      field: 'stackName',
      highlight: true,
    },
  ];

  const data = stacks?.map(stack => {
    return {
      stackName: stack.id,
      url: stack.url,
    };
  });

  return (
    <div>
      <Table
        options={{ paging: false, padding: 'dense', actionsColumnIndex: -1 }}
        data={data || []}
        actions={actions}
        columns={columns}
        title="Pulumi Stacks"
      />
    </div>
  );
};

const actions: TableProps<any>['actions'] = [
  ({ url }) => {
    return {
      icon: () => <OpenInNew aria-label="View" />,
      tooltip: 'URL',
      disabled: !url,
      onClick: () => {
        if (!url) return;
        window.open(url, '_blank');
      },
    };
  },
];

export const PulumiFetchComponent = () => {
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');
  const { value, loading, error } = useAsync(async (): Promise<any[]> => {
    const response = await fetch(`${backendUrl}/api/pulumi/aws/sites`);
    const data = await response.json();

    const finalData = await getStackInfo(data);
    return finalData;
  }, []);

  const getStackInfo = async data => {
    let fullStackInfo: any[] = [];
    try {
      for (let i = 0; i < data.ids.length; i++) {
        const response = await fetch(
          `${backendUrl}/api/pulumi/aws/sites/${data.ids[i]}`,
        );
        const finalResponse = await response.json();
        fullStackInfo.push(finalResponse);
      }

      return fullStackInfo;
    } catch (error) {
      console.log(error);
    }
  };
  if (loading) {
    return <Progress />;
  }

  return (
    <>
      <DefaultTable stacks={value || []} />
    </>
  );
};
